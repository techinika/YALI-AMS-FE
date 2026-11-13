"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/data/use-current-user";
import Loading from "@/app/loading";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const OnlyAdmin = ({ children }: { children: ReactNode }) => {
  const { role, loading } = useCurrentUser();

  if (loading) return <Loading />;
  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">You do not have permission to view this page.</p>
        <Link
          href="/dashboard/profile"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to your profile
        </Link>
      </div>
    );
  }
  return <>{children}</>;
};
