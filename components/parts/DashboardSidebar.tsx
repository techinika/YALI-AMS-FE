"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, type NavDivider, type NavHeader, type NavItem, type NavItemType } from "../Other/Sidebar";
import SidebarFooterAccount from "./SidebarFooter";

type SidebarProps = {
  isAdmin: boolean;
  isSidebarOpen: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
};

function isActive(pathname: string, segment: string) {
  return pathname === segment || (segment !== "/dashboard" && pathname.startsWith(segment + "/"));
}

const NavLink = ({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const active = isActive(pathname, item.segment);
  const Icon = item.icon;
  const base =
    "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const state = active
    ? "bg-primary text-primary-foreground shadow-sm"
    : "text-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <Link
      href={item.segment}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${base} ${state} ${collapsed ? "justify-center" : "gap-3"}`}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.title}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg group-hover:block group-focus-visible:block">
          {item.title}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar({ isAdmin, isSidebarOpen, collapsed, onNavigate }: SidebarProps) {
  const items = NAVIGATION.filter((item) => !item.onlyAdmin || isAdmin);

  const renderItem = (item: NavItemType, index: number) => {
    if ((item as NavHeader).kind === "header") {
      if (collapsed) return <div key={index} className="my-2 border-t border-sidebar-border" aria-hidden="true" />;
      return (
        <h3 key={index} className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {(item as NavHeader).title}
        </h3>
      );
    }
    if ((item as NavDivider).kind === "divider") {
      return <hr key={index} className="my-2 border-sidebar-border" />;
    }
    return <NavLink key={index} item={item as NavItem} collapsed={collapsed} onNavigate={onNavigate} />;
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={`flex h-16 items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "gap-2"}`}>
        <Image src="/yali.png" alt="YALI AMS logo" width={32} height={32} className="h-8 w-8" priority />
        {!collapsed && <span className="text-lg font-bold text-primary">YALI AMS</span>}
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i}>{renderItem(item, i)}</li>
          ))}
        </ul>
      </nav>
      <SidebarFooterAccount mini={collapsed} />
    </div>
  );
}
