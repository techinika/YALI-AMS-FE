import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const matchmakingSlices = createApi({
  reducerPath: "matchmakingSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    aiMatchMaker: builder.mutation({
      query: (data) => ({
        url: `/matchmaking/ai`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useAiMatchMakerMutation } = matchmakingSlices;
