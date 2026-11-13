"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listRecentActivity } from "@/lib/data/activity";

dayjs.extend(relativeTime);

export const RecentEventsCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity", "recent"],
    queryFn: async () => {
      const { data, error } = await listRecentActivity(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-[20rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-foreground">
        <Activity className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
        Recent system activity
      </h2>
      <ul className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {isLoading && (
          <li className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2 border-b border-border pb-3 last:border-b-0">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </li>
        )}
        {isError && <li className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Failed to load activity logs.</li>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && (
          <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No recent activity yet.
          </li>
        )}
        {data?.map((event: any) => (
          <li key={event.id} className="border-b border-border pb-3 last:border-b-0">
            <p className="text-sm font-semibold text-foreground">{String(event.action || "Activity").replace(/_/g, " ")}</p>
            <p className="my-0.5 text-xs text-muted-foreground">
              {event?.model ? `Model "${event.model}"${event.record_id ? ` (record ${event.record_id})` : ""}` : "System event"}
            </p>
            <p className="text-xs font-medium text-primary">{dayjs(event?.timestamp).fromNow()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
