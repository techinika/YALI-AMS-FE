import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { StatsResponse, ActivityTrendResponse } from "@/types/api";

export const statSlice = createApi({
  reducerPath: "statSlice",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    stats: builder.query<StatsResponse, string | void>({
      query: () => `stats`,
    }),
    activityTrend: builder.query<ActivityTrendResponse, number | void>({
      query: (days = 7) => `stats/activity-trend?days=${days}`,
    }),
  }),
});

export const { useStatsQuery, useActivityTrendQuery } = statSlice;
