import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { RecentActivityResponse } from "@/types/log";

export const activitySlices = createApi({
  reducerPath: "activitySlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getRecentActivityLogs: builder.query<RecentActivityResponse, void>({
      query: () => `/activity/recent?limit=5`,
    }),
  }),
});

export const { useGetRecentActivityLogsQuery } = activitySlices;
