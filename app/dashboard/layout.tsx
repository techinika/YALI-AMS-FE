import { AuthGuard } from "@/components/Other/AccessDashboard";
import Layout from "@/components/Other/Layout";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AuthGuard>
        <Layout>{children}</Layout>
      </AuthGuard>
    </div>
  );
}
