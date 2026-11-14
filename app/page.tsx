import { Suspense } from "react";
import LoginForm from "@/components/Home/LoginForm";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="Loading" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
