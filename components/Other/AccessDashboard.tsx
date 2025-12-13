"use client";

import { getUser, isAuthenticated } from "@/helpers/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const AccessDashboard = ({ children }: { children: any }) => {
  useEffect(() => {
    if (!isAuthenticated()) {
      globalThis.location.href = "/";
    }
  }, []);

  return <>{children}</>;
};

export const OnlyAdmin = ({ children }: { children: any }) => {
  const router = useRouter();
  const user = getUser();

  const isAdmin = user?.role?.name == "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard/profile");
    }
  }, [isAdmin]);

  return <div>{children}</div>;
};
