"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally avoid logging sensitive details to console in production UI.
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center" role="alert">
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this page right now. Please try again, or return to the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
