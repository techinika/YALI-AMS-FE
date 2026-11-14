"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Sidebar from "../parts/DashboardSidebar";
import NotificationBell from "./NotificationBell";
import { useCurrentUser } from "@/lib/data/use-current-user";

const COLLAPSE_KEY = "yali.sidebar.collapsed";

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, loading } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const returnFocusTo = menuButtonRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = getFocusable(drawerRef.current);
    (focusables[0] || drawerRef.current)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = getFocusable(drawerRef.current);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      returnFocusTo?.focus?.();
    };
  }, [mobileOpen]);

  const displayName =
    (user?.user_metadata?.first_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Member";
  const isAdmin = (role || "").toLowerCase() === "admin";

  return (
    <div className="min-h-screen bg-background">
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          ref={drawerRef}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] transform bg-sidebar shadow-xl outline-none transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <Sidebar isAdmin={isAdmin} isSidebarOpen={true} collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:transition-[width] lg:duration-200 ${
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        <Sidebar isAdmin={isAdmin} isSidebarOpen={true} collapsed={collapsed} />
      </aside>

      <div className={`flex min-h-screen flex-col ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
            </button>
            <Link href="/dashboard" className="text-sm font-semibold text-foreground sm:text-base">
              <span className="hidden sm:inline">YALI AMS</span>
              <span className="sm:hidden">AMS</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:inline" aria-live="polite">
              {loading ? "Welcome" : `Welcome, ${displayName}`}
            </span>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 outline-none sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground sm:px-6">
          &copy; {new Date().getFullYear()} YALI Rwanda Chapter
        </footer>
      </div>
    </div>
  );
}
