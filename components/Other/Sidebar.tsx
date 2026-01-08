// NAVIGATION.tsx
"use client";

import { NavItemType } from "@/types/sidebar";
import { Database, Settings, Users2 } from "lucide-react";
import {
  MdDashboard,
  MdAccountBox,
  MdVpnKey,
  MdEdit,
  MdNotifications,
  MdChat,
  MdPeople,
  MdPersonAdd,
  MdInterests,
  MdCorporateFare,
} from "react-icons/md";

const TailwindChip = ({ label }: { label: number }) => (
  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium leading-none text-blue-100 bg-primary rounded-full">
    {label}
  </span>
);

export const NAVIGATION: NavItemType[] = [
  {
    segment: "/dashboard",
    title: "Dashboard",
    icon: <MdDashboard className="w-5 h-5" />,
    onlyAdmin: true,
  },
  {
    kind: "header",
    title: "Your Profile",
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/profile",
    title: "View Profile",
    icon: <MdAccountBox className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/profile/update",
    title: "Update Profile",
    icon: <MdEdit className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/organizations",
    title: "Organizations",
    icon: <MdCorporateFare className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    kind: "divider",
    onlyAdmin: false,
  },
  {
    kind: "header",
    title: "Communication",
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/notifications",
    title: "Notifications",
    icon: <MdNotifications className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/chat",
    title: "Chat",
    icon: <MdChat className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/chat/groups",
    title: "Group Chats",
    icon: <Users2 className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    kind: "divider",
    onlyAdmin: false,
  },
  {
    kind: "header",
    title: "Members",
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/members",
    title: "Members",
    icon: <MdPeople className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/members/new",
    title: "Add New User",
    icon: <MdPersonAdd className="w-5 h-5" />,
    onlyAdmin: true,
  },
  {
    segment: "/dashboard/members/match",
    title: "Interest Match",
    icon: <MdInterests className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    kind: "divider",
    onlyAdmin: false,
  },
  {
    kind: "header",
    title: "Security",
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/change-password",
    title: "Change Password",
    icon: <MdVpnKey className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    segment: "/dashboard/settings",
    title: "Settings",
    icon: <Settings className="w-5 h-5" />,
    onlyAdmin: false,
  },
  {
    kind: "divider",
    onlyAdmin: true,
  },
  {
    kind: "header",
    title: "Admin",
    onlyAdmin: true,
  },
  {
    segment: "/dashboard/data",
    title: "Data Management",
    icon: <Database className="w-5 h-5" />,
    onlyAdmin: true,
  },
];
