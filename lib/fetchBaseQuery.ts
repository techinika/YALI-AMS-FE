import { fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { RootState } from "./store";
import { AUTH_STORED_DATA } from "@/helpers/auth";
import { getCookie } from "cookies-next";
import { markSessionExpired } from "./features/auth";

const baseFetch = fetchBaseQuery({
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

export const baseQueryWithAuth = async (
  args: string | { url: string; method?: string; body?: unknown; headers?: Record<string, string> },
  api: any,
  extraOptions: Record<string, unknown>
) => {
  const result = await baseFetch(args, api, extraOptions);

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    const rootState = api.getState() as RootState;
    if (!rootState?.auth?.sessionExpired) {
      api.dispatch(markSessionExpired());
    }
  }

  return result;
};

export { baseQueryWithAuth as baseQueryWithAuthAndReauth };