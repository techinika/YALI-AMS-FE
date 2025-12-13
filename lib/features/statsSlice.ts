import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const statSlice = createApi({
  reducerPath: "statSlice",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    stats: builder.query({
      query: () => `stats`,
    }),
  }),
});

export const { useStatsQuery } = statSlice;
