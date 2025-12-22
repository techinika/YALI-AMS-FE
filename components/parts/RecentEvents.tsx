"use client";

import { useGetRecentActivityLogsQuery } from "@/lib/features/activitySlice";
import dayjs from "dayjs";
import { Activity } from "lucide-react";
import { useEffect } from "react";
import relativeTime from "dayjs/plugin/relativeTime";

export const RecentEventsCard = () => {
  dayjs.extend(relativeTime);
  const { data, isLoading, isError, refetch } = useGetRecentActivityLogsQuery();

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg lg:col-span-1 h-96 flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-red-500" />
        Recent System Activity
      </h3>
      <ul className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && (
          <p className="text-sm text-gray-500 text-center p-3">
            Loading activity logs...
          </p>
        )}

        {isError && (
          <p className="text-sm text-red-500 text-center p-3">
            Failed to load activity logs.
          </p>
        )}

        {data?.data.map((event) => (
          <li
            key={event.id}
            className="border-b border-gray-100 pb-3 last:border-b-0"
          >
            <p className="text-sm font-semibold text-gray-800">
              {event.action.toUpperCase()}
            </p>
            <p className="text-xs text-gray-600 my-0.5">{`In model "${event?.model}", activity "${event?.action}" was performed on record ${event.recordId}`}</p>
            <p className="text-xs text-primary font-medium">
              {dayjs(event?.timestamp).fromNow()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
