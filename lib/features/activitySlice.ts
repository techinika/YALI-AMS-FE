import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const activitySlices = createApi({
  reducerPath: "activitySlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getRecentActivityLogs: builder.query<any[], void>({
      query: () => `/activity/recent?limit=5`,
    }),
  }),
});

export const { useGetRecentActivityLogsQuery } = activitySlices;
