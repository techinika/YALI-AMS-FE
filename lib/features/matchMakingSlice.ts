import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { Member } from "@/types/user";

interface MatchMakingRequest {
  interests: string[];
  description?: string;
}

interface MatchMakingResponse {
  requestId: string;
  message: string;
}

interface MatchHistoryItem {
  id: string;
  interests: string;
  description: string;
  status: string;
  aiSummary: string | null;
  aiResponse: string | null;
  createdAt: string;
  updatedAt: string;
  matches: Array<{
    type: string;
    score: number;
    reason: string;
    user: Member | null;
    group: {
      id: string;
      name: string;
      description: string;
      memberCount: number;
    } | null;
  }>;
}

interface MatchHistoryResponse {
  data: MatchHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface MatchStatusResponse {
  id: string;
  status: string;
  interests: string;
  description: string;
  aiSummary: string | null;
  createdAt: string;
  matches: Array<{
    type: string;
    score: number;
    reason: string;
    user: Member | null;
    group: {
      id: string;
      name: string;
      description: string;
      memberCount: number;
    } | null;
  }>;
}

export const matchmakingSlices = createApi({
  reducerPath: "matchmakingSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["MatchHistory"],
  endpoints: (builder) => ({
    aiMatchMaker: builder.mutation<MatchMakingResponse, MatchMakingRequest>({
      query: (data) => ({
        url: `/matchmaking/ai`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MatchHistory"],
    }),
    getMatchmakingHistory: builder.query<MatchHistoryResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `/matchmaking/history?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["MatchHistory"],
    }),
    getMatchmakingStatus: builder.query<MatchStatusResponse, string>({
      query: (requestId) => ({
        url: `/matchmaking/status/${requestId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, requestId) => [{ type: "MatchHistory", id: requestId }],
      pollingInterval: (currentData, _arg) => {
        return currentData?.status === "completed" || currentData?.status === "failed" ? 0 : 5000;
      },
    }),
  }),
});

export const { useAiMatchMakerMutation, useGetMatchmakingHistoryQuery, useGetMatchmakingStatusQuery } = matchmakingSlices;
