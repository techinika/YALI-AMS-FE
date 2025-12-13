"use client";

import { getUser } from "@/helpers/auth";
import { logout } from "@/helpers/logout";
import { processLogout } from "@/lib/features/auth";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import { MdLogout, MdAccountCircle } from "react-icons/md";

const AccountPreview = ({ mini }: { mini: boolean }) => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className={`p-2 ${mini ? "hidden" : "block"}`}>
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
          <MdAccountCircle className="w-6 h-6" />
        </div>
        <div className="flex flex-col truncate">
          <span className="font-semibold text-gray-900 truncate">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-xs text-gray-500 truncate">{user?.email}</span>
        </div>
      </div>
    </div>
  );
};

export default function SidebarFooterAccount({ mini }: { mini: boolean }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  if (mini) {
    return (
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className="w-full flex justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <MdLogout className="w-6 h-6" />
        </button>
      </div>
    );
  }

  const handleLogout = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    await logout();
    dispatch(processLogout());
    router.push("/");
  };

  return (
    <footer className="p-1 border-t border-gray-200">
      <AccountPreview mini={mini} />
      <div className="px-2 pb-2">
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
        >
          <MdLogout className="w-5 h-5 mr-3" /> Sign Out
        </button>
      </div>
    </footer>
  );
}

export function ToolbarAccountOverride() {
  return null;
}
