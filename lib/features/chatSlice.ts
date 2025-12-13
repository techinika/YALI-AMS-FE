import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const chatSlices = createApi({
  reducerPath: "chatSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    chats: builder.query({
      query: () => `chat`,
    }),
    topMembers: builder.query({
      query: () => `chat/top`,
    }),
    addMessage: builder.mutation({
      query: (credentials) => ({
        url: "chat",
        method: "POST",
        body: credentials,
      }),
    }),
    privateChats: builder.query({
      query: (id) => `chat/${id}`,
    }),
    privateMessages: builder.query({
      query: (data) => `chat/${data?.id}/${data?.oid}`,
    }),
  }),
});

export const {
  useAddMessageMutation,
  useChatsQuery,
  usePrivateChatsQuery,
  usePrivateMessagesQuery,
  useTopMembersQuery,
} = chatSlices;
