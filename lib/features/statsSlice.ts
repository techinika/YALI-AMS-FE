import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { StatsResponse } from "@/types/api";

export const statSlice = createApi({
  reducerPath: "statSlice",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    stats: builder.query<StatsResponse, string | void>({
      query: () => `stats`,
    }),
  }),
});

export const { useStatsQuery } = statSlice;
