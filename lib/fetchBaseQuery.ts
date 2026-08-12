import { fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { RootState } from "./store";
import { AUTH_STORED_DATA } from "@/helpers/auth";
import { getCookie, deleteCookie } from "cookies-next";

const handleUnauthorized = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORED_DATA.USER);
    deleteCookie(AUTH_STORED_DATA.TOKEN, { path: "/" });
    deleteCookie(AUTH_STORED_DATA.USER, { path: "/" });
    window.location.href = "/";
  }
};

export const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getCookie(AUTH_STORED_DATA?.TOKEN);

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");

    return headers;
  },
});

export const baseQueryWithAuthAndReauth = async (
  args: string | { url: string; method?: string; body?: unknown; headers?: Record<string, string> },
  api: Parameters<typeof baseQueryWithAuth>[1],
  extraOptions: Record<string, unknown>
) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    handleUnauthorized();
  }

  return result;
};
