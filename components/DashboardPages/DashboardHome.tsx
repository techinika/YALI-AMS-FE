"use client";

import React, { useMemo } from "react";
import {
  User,
  MessageSquare,
  Clock,
  Bell,
  BarChart,
  Trophy,
  Activity,
} from "lucide-react";
import { useStatsQuery } from "@/lib/features/statsSlice";
import Link from "next/link";
import { useTopMembersQuery } from "@/lib/features/chatSlice";
import { Member } from "@/types/user";
import { StatsCardSkeleton } from "../ui/skeleton";
import { RecentEventsCard } from "../parts/RecentEvents";

interface StatCardProps {
  title: string;
  numbers: number;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  numbers,
  icon,
  link,
  color,
}) => {
  return (
    <Link href={link} className="block shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-2xl">
      <div
        className={`bg-white border-l-4 border-${color}-500 p-6 flex items-center space-x-4 h-full rounded-2xl overflow-hidden`}
      >
        <div
          className={`p-3 rounded-full bg-${color}-100 text-${color}-600 shrink-0`}
        >
          {icon}
        </div>
        <div className="grow">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <h1 className="font-extrabold text-3xl text-gray-800 mt-1">
            {numbers.toLocaleString()}
          </h1>
        </div>
      </div>
    </Link>
  );
});

const TopUsersCard: React.FC<{ TopMembersData?: { data: { user: Member; messageCount: number }[] } }> = React.memo(
  ({ TopMembersData }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-96 flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" />
        Top 3 Active Members
      </h3>
      {TopMembersData?.data && TopMembersData.data.length > 0 ? (
        <ul className="space-y-3">
          {TopMembersData.data.map(
            (item, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`font-bold text-lg w-6 text-center ${
                      index === 0 ? "text-yellow-500" : "text-gray-400"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-700">
                    {item?.user?.firstName + " " + item?.user?.lastName}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {item?.messageCount.toLocaleString()} Messages
                </span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="text-center m-2">
          No active members data available yet.
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link
          href="/dashboard/members"
          className="text-sm font-medium text-primary hover:text-primary/80 flex items-center"
        >
          View full leaderboard
        </Link>
      </div>
    </div>
  )
);

const DashboardHome = () => {
  const { data: StatsData, isLoading } = useStatsQuery("");
  const { data: TopMembersData } = useTopMembersQuery("");

  const stats = useMemo(
    () => [
      {
        id: 1,
        icon: <User size={24} />,
        number: StatsData?.users || 0,
        title: "Total Members",
        link: "/dashboard/members",
        color: "blue",
      },
      {
        id: 2,
        icon: <MessageSquare size={24} />,
        number: StatsData?.messages || 0,
        title: "Total Messages",
        link: "/dashboard/chat",
        color: "blue",
      },
      {
        id: 3,
        icon: <Clock size={24} />,
        number: StatsData?.notificationsUnopened || 0,
        title: "Unresolved Tasks",
        link: "#",
        color: "amber",
      },
      {
        id: 4,
        icon: <Bell size={24} />,
        number: StatsData?.sentNotifications || 0,
        title: "Notifications Sent",
        link: "/dashboard/notifications",
        color: "green",
      },
    ],
    [StatsData],
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-full font-sans">
        <div className="mb-6">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded mb-4" />
          <div className="h-6 w-96 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-lg h-96" />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg h-96" />
        </div>
      </div>
    );
  }

  const ActivityTrendCard = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-96 flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <BarChart className="w-5 h-5 mr-2 text-primary" />
        7-Day Activity Trend
      </h3>
      <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
        <p>
          <br />
          Chart Placeholder: Messaging Volume
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-full font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Dashboard Overview
      </h1>
      <p className="text-gray-600 mb-8">
        Welcome back! Here's a summary of your system's performance and
        activity.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <StatCard
            link={stat.link}
            icon={stat.icon}
            title={stat.title}
            numbers={stat.number}
            color={stat.color}
            key={stat.id}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTrendCard />
        </div>

        <TopUsersCard TopMembersData={TopMembersData} />
      </div>

      <div className="mt-6">
        <RecentEventsCard />
      </div>
    </div>
  );
};

export default DashboardHome;
