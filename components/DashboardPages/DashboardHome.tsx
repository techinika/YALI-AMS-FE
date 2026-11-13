"use client";

import React, { useMemo } from "react";
import { User, MessageSquare, Clock, Bell, BarChart3, Trophy } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/data/stats";
import { listActivityTrend, listTopMembers } from "@/lib/data/activity";
import { useCurrentUser } from "@/lib/data/use-current-user";
import { RecentEventsCard } from "../parts/RecentEvents";

type Tone = "brand" | "amber" | "green" | "rose";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  tone: Tone;
  loading?: boolean;
}

const tones: Record<Tone, { border: string; iconBg: string; icon: string }> = {
  brand: { border: "border-l-primary", iconBg: "bg-brand-100", icon: "text-primary" },
  amber: { border: "border-l-amber-600", iconBg: "bg-amber-100", icon: "text-amber-700" },
  green: { border: "border-l-green-600", iconBg: "bg-green-100", icon: "text-green-700" },
  rose: { border: "border-l-rose-600", iconBg: "bg-rose-100", icon: "text-rose-700" },
};

const StatCard: React.FC<StatCardProps> = React.memo(({ title, value, icon, href, tone, loading }) => {
  const t = tones[tone];
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border border-border border-l-4 ${t.border} bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.icon}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value.toLocaleString()}</p>
          )}
        </div>
      </div>
    </Link>
  );
});
StatCard.displayName = "StatCard";

const ActivityTrendCard = ({
  points,
  loading,
}: {
  points?: { date: string; count: number }[];
  loading?: boolean;
}) => {
  const max = Math.max(1, ...(points ?? []).map((point) => point.count));
  return (
    <div className="flex min-h-[20rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-foreground">
        <BarChart3 className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
        7-day activity trend
      </h2>
      {loading ? (
        <div className="flex flex-1 items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-40 flex-1 animate-pulse rounded-t bg-muted" />
          ))}
        </div>
      ) : (points?.length ?? 0) > 0 ? (
        <ul className="flex flex-1 items-end gap-2" aria-label="Messages per day">
          {points?.map((point) => (
            <li key={point.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end" title={`${point.count} messages`}>
                <div
                  className="w-full rounded-t bg-primary/70 transition-[height] duration-300"
                  style={{ height: `${Math.max(4, Math.round((point.count / max) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{point.date.slice(5)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </div>
      )}
    </div>
  );
};

const TopMembersCard = ({
  members,
  loading,
}: {
  members?: { id: string; firstName: string; lastName: string; avatarPath: string | null; messageCount: number }[];
  loading?: boolean;
}) => {
  return (
    <section aria-label="Top members" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-foreground">
        <Trophy className="mr-2 h-5 w-5 text-amber-600" aria-hidden="true" />
        Top active members
      </h2>
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </ul>
      ) : (members?.length ?? 0) > 0 ? (
        <ol className="space-y-3">
          {members?.map((member, index) => (
            <li key={member.id} className="flex items-center gap-3">
              <span className="w-5 text-sm font-semibold text-muted-foreground">{index + 1}</span>
              {member.avatarPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarPath} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
                  {`${member.firstName.charAt(0)}${member.lastName.charAt(0)}`}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {[member.firstName, member.lastName].filter(Boolean).join(" ")}
              </span>
              <span className="text-xs text-muted-foreground">{member.messageCount.toLocaleString()} messages</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      )}
    </section>
  );
};

export default function DashboardHome() {
  const { role } = useCurrentUser();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });
  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: () => listActivityTrend(7),
  });
  const { data: topMembers, isLoading: topMembersLoading } = useQuery({
    queryKey: ["dashboard", "top-members"],
    queryFn: () => listTopMembers(3),
  });

  const cards = useMemo(
    () => [
      { title: "Total members", value: stats?.users || 0, icon: <User className="h-5 w-5" aria-hidden="true" />, href: "/dashboard/members", tone: "brand" as const },
      { title: "Total messages", value: stats?.messages || 0, icon: <MessageSquare className="h-5 w-5" aria-hidden="true" />, href: "/dashboard/chat", tone: "brand" as const },
      { title: "Unopened notifications", value: stats?.notificationsUnopened || 0, icon: <Clock className="h-5 w-5" aria-hidden="true" />, href: "/dashboard/notifications", tone: "amber" as const },
      { title: "Notifications sent", value: stats?.sentNotifications || 0, icon: <Bell className="h-5 w-5" aria-hidden="true" />, href: "/dashboard/notifications", tone: "green" as const },
    ],
    [stats]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard overview</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">A quick glance at key community metrics and recent activity.</p>
      </header>

      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} loading={isLoading} />
          ))}
        </div>
      </section>

      <section
        aria-label="Activity and insights"
        className={`grid grid-cols-1 gap-6 ${role === "admin" ? "xl:grid-cols-2" : ""}`}
      >
        {role === "admin" && <RecentEventsCard />}
        <ActivityTrendCard points={trend} loading={trendLoading} />
      </section>

      <TopMembersCard members={topMembers} loading={topMembersLoading} />
    </div>
  );
}
