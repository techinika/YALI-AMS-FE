"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/data/client";
import { useRouter } from "next/navigation";
import { LogOut, CircleUserRound } from "lucide-react";

const AccountPreview = ({ mini }: { mini: boolean }) => {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setEmail(user?.email || "");
      const n =
        (user?.user_metadata?.full_name as string | undefined) ||
        [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
          .filter(Boolean)
          .join(" ") ||
        "";
      setName(n);
    });
  }, []);

  if (mini) return null;

  return (
    <div className="p-2">
      <div className="flex items-center gap-3 rounded-lg p-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CircleUserRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{name || "Account"}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </div>
      </div>
    </div>
  );
};

export default function SidebarFooterAccount({ mini }: { mini: boolean }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (mini) {
    return (
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="group relative flex h-10 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg group-hover:block group-focus-visible:block">
            Sign out
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-1">
      <AccountPreview mini={mini} />
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md p-2 text-sm text-foreground transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  );
}
