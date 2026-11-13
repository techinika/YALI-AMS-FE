"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell, ArrowLeft, X, AlertTriangle, Settings, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../parts/PageHeader";
import { NotificationSkeleton } from "../ui/skeleton";
import { listMyNotifications, markNotificationOpened } from "@/lib/data/notifications";

dayjs.extend(relativeTime);

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  created_at: string;
  opened: boolean;
  type?: "system" | "alert" | "update" | string;
};

const NotificationIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case "alert":
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case "update":
      return <Clock className="w-5 h-5 text-blue-500" />;
    case "system":
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

function Notifications() {
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data, error } = await listMyNotifications();
      if (error) throw error;
      return (data ?? []) as NotificationItem[];
    },
  });

  const openMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await markNotificationOpened(id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "me"] }),
  });

  const sortedNotifications = useMemo(
    () => [...(data ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [data]
  );

  const selectedNotification = useMemo(
    () => sortedNotifications.find((n) => n.id === currentNotificationId),
    [sortedNotifications, currentNotificationId]
  );

  const handleOpenNotification = useCallback(
    async (id: string) => {
      if (id === currentNotificationId) return;
      setCurrentNotificationId(id);
      const n = sortedNotifications.find((x) => x.id === id);
      if (n && !n.opened) openMutation.mutate(id);
    },
    [currentNotificationId, sortedNotifications, openMutation]
  );

  useEffect(() => {
    if (!currentNotificationId && sortedNotifications.length > 0 && !isLoading) {
      const firstUnread = sortedNotifications.find((n) => !n.opened);
      setCurrentNotificationId((firstUnread ?? sortedNotifications[0]).id);
    }
  }, [sortedNotifications, currentNotificationId, isLoading]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="container mx-auto">
        <PageHeader
          title="Notifications"
          description="Access system messages, alerts, and updates related to your account."
          actionTitle=""
          onAction={() => {}}
          Icon={Settings}
          loading={false}
          disabled={true}
        />

        <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-2xl overflow-hidden min-h-[70vh]">
          <div className={`w-full lg:w-96 border-r border-gray-100 shrink-0 ${currentNotificationId ? "hidden lg:block" : "block"}`}>
            <div className="sticky top-0 bg-blue-50/50 backdrop-blur-sm z-10 p-4 border-b border-blue-100">
              <h2 className="text-xl font-bold text-primary">Messages</h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {isLoading && Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
              {!isLoading && sortedNotifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm">No Notifications for Now! Check back later!</p>
                </div>
              )}
              {!isLoading &&
                sortedNotifications.map((noti) => (
                  <div
                    key={noti.id}
                    className={`flex items-start p-4 cursor-pointer border-b transition-colors ${
                      noti.id === currentNotificationId ? "bg-blue-50 border-blue-200" : noti.opened ? "hover:bg-gray-100 border-gray-50" : "hover:bg-blue-100/50 bg-white border-gray-50"
                    }`}
                    onClick={() => handleOpenNotification(noti.id)}
                  >
                    <div className="flex-shrink-0 pt-1"><NotificationIcon type={noti.type} /></div>
                    <div className="ml-4 min-w-0 grow">
                      <div className="flex justify-between items-center mb-1">
                        <p className={`font-semibold truncate ${!noti.opened ? "text-gray-800" : "text-gray-500"}`}>{noti.title}</p>
                        {!noti.opened && <span className="w-2 h-2 bg-primary rounded-full shrink-0 ml-2" title="Unread"></span>}
                      </div>
                      <p className="text-xs text-gray-400">{dayjs(noti.created_at).fromNow()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className={`w-full lg:grow p-0 overflow-y-auto ${!currentNotificationId ? "hidden" : "block"}`}>
            <div className="p-6">
              <button onClick={() => setCurrentNotificationId(null)} className="lg:hidden flex items-center text-primary hover:text-primary/80 mb-4 font-medium transition">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inbox
              </button>
              {selectedNotification ? (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-extrabold text-gray-800">{selectedNotification.title}</h2>
                      <X className="w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer lg:hidden" onClick={() => setCurrentNotificationId(null)} />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{dayjs(selectedNotification.created_at).format("MMMM D, YYYY h:mm A")}</p>
                  </div>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</div>
                  {selectedNotification.link && (
                    <button onClick={() => router.push(selectedNotification.link!)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Open</button>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 p-10">Select a notification</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
