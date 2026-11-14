"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Inbox } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyNotifications, markNotificationOpened } from "@/lib/data/notifications";

dayjs.extend(relativeTime);

type Noti = { id: string; title: string; message: string; created_at: string; opened: boolean };

const NotificationBell = React.memo(() => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data, error } = await listMyNotifications();
      if (error) throw error;
      return (data ?? []) as Noti[];
    },
    refetchInterval: 30000,
  });

  const openMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await markNotificationOpened(id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "me"] }),
  });

  const unread = useMemo(() => (data ?? []).filter((n) => !n.opened), [data]);
  const unreadCount = unread.length;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleOpen = useCallback(
    async (id: string) => {
      setOpen(false);
      openMutation.mutate(id);
      router.push("/dashboard/notifications");
    },
    [openMutation, router]
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
            <h3 className="flex items-center text-sm font-bold text-foreground">
              <Bell className="mr-2 h-4 w-4 text-primary" aria-hidden="true" /> Notifications
            </h3>
            {unreadCount > 0 && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{unreadCount} unread</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {unread.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Inbox className="mb-2 h-8 w-8 opacity-60" aria-hidden="true" />
                <p className="text-sm">You are all caught up!</p>
              </div>
            ) : (
              unread.slice(0, 20).map((noti) => (
                <button key={noti.id} type="button" onClick={() => handleOpen(noti.id)} className="w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{noti.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{noti.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{dayjs(noti.created_at).fromNow()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <button type="button" onClick={() => { setOpen(false); router.push("/dashboard/notifications"); }} className="w-full bg-accent py-2.5 text-center text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/80">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = "NotificationBell";
export default NotificationBell;
