"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { setCookie, getCookie } from "cookies-next";
import { MdErrorOutline } from "react-icons/md";
import {
  clearSessionExpired,
  processLogout,
  setCredentials,
} from "@/lib/features/auth";
import { useExtendSessionMutation } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { AUTH_STORED_DATA, getUserOrCache } from "@/helpers/auth";
import { logout } from "@/helpers/logout";

const SessionExpiredModal = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);
  const [extendSession, { isLoading: extending }] = useExtendSessionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!sessionExpired) return null;

  const handleLogout = () => {
    logout();
    dispatch(processLogout());
    dispatch(clearSessionExpired());
    router.push("/");
  };

  const handleExtend = async () => {
    setErrorMessage(null);

    const cookieToken = getCookie(AUTH_STORED_DATA?.TOKEN);
    const token = typeof cookieToken === "string" ? cookieToken : undefined;
    if (!token) {
      handleLogout();
      return;
    }

    try {
      const result = await extendSession(token).unwrap();

      setCookie(AUTH_STORED_DATA?.TOKEN, result.token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 86400,
      });

      const cachedUser = getUserOrCache();

      dispatch(
        setCredentials({
          token: result.token,
          user: (result?.user as any) ?? cachedUser,
        })
      );
      dispatch(clearSessionExpired());

      window.location.reload();
    } catch (err: any) {
      console.error("Session extension failed:", err);
      setErrorMessage(
        err?.data?.message ||
          "Your session has fully expired and can no longer be extended."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-2xl transition-all">
        <div className="flex items-start space-x-3">
          <span className="text-amber-500">
            <MdErrorOutline className="w-8 h-8" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Session expired</h3>
            <p className="mt-1 text-sm text-gray-600">
              Your login session has come to an end, which is why some data
              stopped loading. Extend your session to keep working, or log out
              and sign in again.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleLogout}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
          >
            Log out
          </button>
          <button
            onClick={handleExtend}
            disabled={extending}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition duration-150 flex items-center ${
              extending
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary shadow-md"
            }`}
          >
            {extending ? "Extending..." : "Extend session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;