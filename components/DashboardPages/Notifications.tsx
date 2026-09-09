"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Bell,
  Mail,
  Clock,
  ArrowLeft,
  X,
  AlertTriangle,
  Settings,
} from "lucide-react";
import DOMPurify from "dompurify";
import { useAppSelector } from "@/lib/hooks";
import { useNotificationsQuery, useOpenNotificationMutation } from "@/lib/features/notificationSlice";
import { PageHeader } from "../parts/PageHeader";
import { Skeleton, NotificationSkeleton } from "../ui/skeleton";

dayjs.extend(relativeTime);

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  opened: boolean;
  type: "system" | "alert" | "update";
}

const NotificationActionMap: Record<
  string,
  { label: string; path: string }
> = {
  confirm: { label: "Confirm to update", path: "/dashboard/profile/update" },
  decline: { label: "Decline to update", path: "/dashboard/profile" },
  login: { label: "Login", path: "/" },
};

const NotificationIcon = ({ type }: { type: NotificationItem["type"] }) => {
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

const NotificationItemRow = React.memo(
  ({
    noti,
    isSelected,
    onClick,
  }: {
    noti: NotificationItem;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div
      className={`flex items-start p-4 cursor-pointer border-b transition-colors ${
        isSelected
          ? "bg-blue-50 border-blue-200 shadow-inner"
          : noti.opened
            ? "hover:bg-gray-100 border-gray-50"
            : "hover:bg-blue-100/50 bg-white border-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 pt-1">
        <NotificationIcon type={noti.type} />
      </div>
      <div className="ml-4 min-w-0 grow">
        <div className="flex justify-between items-center mb-1">
          <p
            className={`font-semibold truncate ${
              !noti.opened ? "text-gray-800" : "text-gray-500"
            }`}
          >
            {noti.title}
          </p>
          {!noti.opened && (
            <span
              className="w-2 h-2 bg-primary rounded-full shrink-0 ml-2"
              title="Unread"
            ></span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {dayjs(noti.createdAt).fromNow()}
        </p>
      </div>
    </div>
  )
);

function Notifications() {
  const [currentNotificationId, setCurrentNotificationId] = useState<
    string | null
  >(null);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  const { data, isLoading, refetch } = useNotificationsQuery(user?.id);
  const [openNotification] = useOpenNotificationMutation();

  const rawNotifications = data?.notifications || [];

  const sortedNotifications: NotificationItem[] = useMemo(() => {
    return [...rawNotifications].sort(
      (a: NotificationItem, b: NotificationItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawNotifications]);

  const unreadCount = sortedNotifications.filter((n) => !n.opened).length;

  // Find the selected notification message and metadata
  const selectedNotification = useMemo(() => {
    return sortedNotifications.find(
      (noti) => noti.id === currentNotificationId
    );
  }, [sortedNotifications, currentNotificationId]);

  // Handler to open and mark a notification as read
  const handleOpenNotification = useCallback(
    async (id: string) => {
      if (id !== currentNotificationId) {
        setCurrentNotificationId(id);
        const notiToOpen = sortedNotifications.find((n) => n.id === id);
        if (notiToOpen && !notiToOpen.opened) {
          await openNotification({ id });
          refetch();
        }
      }
    },
    [currentNotificationId, sortedNotifications, openNotification, refetch]
  );

  // Handler for mobile back button
  const handleCloseDetail = useCallback(() => {
    setCurrentNotificationId(null);
  }, []);

  // Handler for notification action buttons (e.g. confirm/decline update)
  const handleNotificationAction = useCallback(
    async (noti: NotificationItem, path: string) => {
      if (!noti.opened) {
        await openNotification({ id: noti.id });
        refetch();
      }
      router.push(path);
    },
    [openNotification, refetch, router]
  );

  // Set the first unread notification as selected on initial load
  useEffect(() => {
    if (
      !currentNotificationId &&
      sortedNotifications.length > 0 &&
      !isLoading
    ) {
      const firstUnread = sortedNotifications.find((n) => !n.opened);
      if (firstUnread) {
        handleOpenNotification(firstUnread.id);
      } else {
        // If all are read, select the newest one
        setCurrentNotificationId(sortedNotifications[0].id);
      }
    }
  }, [
    sortedNotifications,
    currentNotificationId,
    isLoading,
    handleOpenNotification,
  ]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="container mx-auto">
        <PageHeader
          title="Notifications"
          description="Access system messages, alerts, and updates related to your account."
          actionTitle="Setup"
          onAction={() => console.log("setup")}
          Icon={Settings}
          loading={false}
          disabled={false}
        />

        <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-2xl overflow-hidden min-h-[70vh]">
          <div
            className={`w-full lg:w-96 border-r border-gray-100 shrink-0 ${
              currentNotificationId ? "hidden lg:block" : "block"
            }`}
          >
            <div className="sticky top-0 bg-blue-50/50 backdrop-blur-sm z-10 p-4 border-b border-blue-100">
              <h2 className="text-xl font-bold text-primary">Messages</h2>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}

              {!isLoading && sortedNotifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm">
                    No Notifications for Now! Check back later!
                  </p>
                </div>
              )}

              {!isLoading &&
                sortedNotifications.map((noti) => (
                  <NotificationItemRow
                    key={noti.id}
                    noti={noti}
                    isSelected={noti.id === currentNotificationId}
                    onClick={() => handleOpenNotification(noti.id)}
                  />
                ))}
            </div>
          </div>

          <div
            className={`w-full lg:grow p-0 overflow-y-auto ${
              !currentNotificationId ? "hidden" : ""
            } ${currentNotificationId ? "block" : "hidden"}`}
          >
            <div className="p-6">
              {/* Mobile Back Button */}
              <button
                onClick={handleCloseDetail}
                className="lg:hidden flex items-center text-primary hover:text-primary/80 mb-4 font-medium transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Inbox
              </button>

              {selectedNotification ? (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-extrabold text-gray-800">
                        {selectedNotification.title}
                      </h2>
                      <X
                        className="w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer lg:hidden"
                        onClick={handleCloseDetail}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" />
                      Received{" "}
                      {dayjs(selectedNotification.createdAt).format(
                        "MMM D, YYYY [at] h:mm A"
                      )}
                    </p>
                  </div>

                  <div
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none! p-4 text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedNotification.message),
                    }}
                  ></div>

                  {selectedNotification.link && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {selectedNotification.link
                        .split("+")
                        .map((actionId) => {
                          const action = NotificationActionMap[actionId as string];
                          if (!action) return null;
                          return (
                            <button
                              key={actionId}
                              onClick={() =>
                                handleNotificationAction(
                                  selectedNotification,
                                  action.path
                                )
                              }
                              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 shadow-md transition-colors"
                            >
                              {action.label}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-16 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                  <p className="text-lg font-medium">
                    Select a message to view its content.
                  </p>
                  <p className="text-sm">
                    Click on any item in the left panel to open it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
