import {
  LayoutDashboard,
  UserCircle,
  UserPen,
  Building2,
  Bell,
  MessageSquare,
  Users,
  UserPlus,
  Sparkles,
  KeyRound,
  Settings,
  Database,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  segment: string;
  title: string;
  icon: LucideIcon;
  onlyAdmin: boolean;
};

export type NavHeader = {
  kind: "header";
  title: string;
  onlyAdmin: boolean;
};

export type NavDivider = {
  kind: "divider";
  onlyAdmin: boolean;
};

export type NavItemType = NavItem | NavHeader | NavDivider;

export const NAVIGATION: NavItemType[] = [
  { segment: "/dashboard", title: "Dashboard", icon: LayoutDashboard, onlyAdmin: true },
  { kind: "header", title: "Your Profile", onlyAdmin: false },
  { segment: "/dashboard/profile", title: "View Profile", icon: UserCircle, onlyAdmin: false },
  { segment: "/dashboard/profile/update", title: "Update Profile", icon: UserPen, onlyAdmin: false },
  { segment: "/dashboard/organizations", title: "Organizations", icon: Building2, onlyAdmin: false },
  { kind: "divider", onlyAdmin: false },
  { kind: "header", title: "Communication", onlyAdmin: false },
  { segment: "/dashboard/notifications", title: "Notifications", icon: Bell, onlyAdmin: false },
  { segment: "/dashboard/chat", title: "Chat", icon: MessageSquare, onlyAdmin: false },
  { segment: "/dashboard/chat/groups", title: "Group Chats", icon: Users, onlyAdmin: false },
  { kind: "divider", onlyAdmin: false },
  { kind: "header", title: "Members", onlyAdmin: false },
  { segment: "/dashboard/members", title: "Members", icon: Users, onlyAdmin: false },
  { segment: "/dashboard/members/new", title: "Add New User", icon: UserPlus, onlyAdmin: true },
  { segment: "/dashboard/members/match", title: "Interest Match", icon: Sparkles, onlyAdmin: false },
  { kind: "divider", onlyAdmin: false },
  { kind: "header", title: "Security", onlyAdmin: false },
  { segment: "/dashboard/change-password", title: "Change Password", icon: KeyRound, onlyAdmin: false },
  { segment: "/dashboard/settings", title: "Settings", icon: Settings, onlyAdmin: false },
  { kind: "divider", onlyAdmin: true },
  { kind: "header", title: "Admin", onlyAdmin: true },
  { segment: "/dashboard/data", title: "Data Management", icon: Database, onlyAdmin: true },
];
