"use client";

import { getUser, isAuthenticated, token } from "@/helpers/auth";
import { setCredentials } from "@/lib/features/auth";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import Loading from "@/app/loading";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const authUser = getUser();
    const authToken = token();

    if (authUser && authToken) {
      dispatch(setCredentials({ token: authToken, user: authUser }));
    }

    if (!isAuthenticated()) {
      globalThis.location.href = "/";
    } else {
      setAuthorized(true);
    }
  }, [dispatch]);

  if (!authorized) return <Loading />;
  return <>{children}</>;
};

export const OnlyAdmin = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getUser();
    const isAdmin = user?.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      router.push("/dashboard/profile");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return <Loading />;
  return <div>{children}</div>;
};
