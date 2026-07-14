import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { Member } from "@/types/user";

interface MatchMakingRequest {
  interests: string[];
  cohortId?: string;
}

interface MatchMakingResponse {
  data: Member[];
  message: string;
}

export const matchmakingSlices = createApi({
  reducerPath: "matchmakingSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    aiMatchMaker: builder.mutation<MatchMakingResponse, MatchMakingRequest>({
      query: (data) => ({
        url: `/matchmaking/ai`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useAiMatchMakerMutation } = matchmakingSlices;
