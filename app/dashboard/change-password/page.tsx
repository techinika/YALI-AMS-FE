import { Suspense } from "react";
import ChangePasswordPage from "@/components/DashboardPages/ResetPassword";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ChangePasswordPage />
    </Suspense>
  );
}
