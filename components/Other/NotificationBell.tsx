"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Inbox } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import {
  useUnopenedNotificationsQuery,
  useOpenNotificationMutation,
} from "@/lib/features/notificationSlice";
import { NotificationItem } from "@/types/api";
import { getSocket } from "@/lib/sockets";
import { toastWarning } from "@/lib/toast";

dayjs.extend(relativeTime);

const NotificationBell = React.memo(() => {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useUnopenedNotificationsQuery(user?.id, {
    skip: !user?.id,
    pollingInterval: 30000,
  });

  const [openNotification] = useOpenNotificationMutation();

  const notifications = useMemo(
    () =>
      [...(data?.notifications ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [data]
  );

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    const refresh = () => refetch();

    socket.on("new-message", refresh);
    socket.on("new-group-message", refresh);
    socket.on("notification:new", (payload: NotificationItem) => {
      refetch();
      if (payload?.id && payload?.title) toastWarning(payload.title);
    });

    return () => {
      socket.off("new-message", refresh);
      socket.off("new-group-message", refresh);
      socket.off("notification:new");
    };
  }, [user?.id, refetch]);

  const handleOpenNotification = useCallback(
    async (id: string) => {
      setOpen(false);
      try {
        await openNotification({ id }).unwrap();
      } catch {
        // ignore open errors; navigation still proceeds
      }
      refetch();
      router.push("/dashboard/notifications");
    },
    [openNotification, refetch, router]
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-primary" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 text-gray-400">
                <Inbox className="w-8 h-8 mb-2 opacity-60" />
                <p className="text-sm">You are all caught up!</p>
              </div>
            ) : (
              notifications.map((noti) => (
                <button
                  key={noti.id}
                  type="button"
                  onClick={() => handleOpenNotification(noti.id)}
                  className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {noti.title}
                      </p>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                        {noti.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {dayjs(noti.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/notifications");
            }}
            className="w-full py-2.5 text-center text-xs font-bold text-primary bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = "NotificationBell";

export default NotificationBell;
