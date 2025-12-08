// Layout.tsx
"use client";
import React, { useState } from "react";
import Copyright from "../parts/Copyright";
import { MdMenu } from "react-icons/md";
import Sidebar from "../parts/DashboardSidebar";
import { getUser } from "@/helpers/auth";
import { Member } from "@/types/user";
import Loading from "@/app/loading";

const AccessDashboard = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full w-full">{children}</div>
);

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = React.useState(true);
  const [member, setMember] = React.useState<Member>();

  React.useEffect(() => {
    setLoading(true);
    setMember(getUser());
    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const contentMargin = isSidebarOpen ? "ml-60" : "ml-20";

  if (loading) {
    return <Loading />;
  }

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
            <span className="text-gray-500">
              Welcome{` ${member?.firstName}`}!
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <AccessDashboard>{children}</AccessDashboard>
        </main>

        <footer className="p-4 border-t border-gray-200 bg-white">
          <Copyright />
        </footer>
      </div>
    </div>
  );
}

export default Layout;
