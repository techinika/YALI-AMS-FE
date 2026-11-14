import { Suspense } from "react";
import ForgotPasswordPage from "@/components/Home/ForgotPassword";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
