"use client";
import React, { useState } from "react";
import Copyright from "../parts/Copyright";
import { MdMenu } from "react-icons/md";
import Sidebar from "../parts/DashboardSidebar";
import { useAppSelector } from "@/lib/hooks";
import { RefDataPrefetcher } from "./RefDataPrefetcher";
import NotificationBell from "./NotificationBell";
import SessionExpiredModal from "./SessionExpiredModal";

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const member = useAppSelector((state) => state.auth.user);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const contentMargin = isSidebarOpen ? "ml-60" : "ml-20";

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${contentMargin}`}
      >
        <header className="h-16 flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-primary transition-colors"
            aria-label="Toggle sidebar"
          >
            <MdMenu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            <NotificationBell />
            <span className="text-gray-500">
              Welcome{` ${member?.firstName}`}!
            </span>
          </div>
        </header>

        <RefDataPrefetcher />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="h-full w-full">{children}</div>
        </main>

        <SessionExpiredModal />

        <footer className="p-4 border-t border-gray-200 bg-white">
          <Copyright />
        </footer>
      </div>
    </div>
  );
}

export default Layout;
