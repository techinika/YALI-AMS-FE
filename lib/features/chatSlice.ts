import { createApi } from "@reduxjs/toolkit/query/react";
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

    addNewGroup: builder.mutation({
      query: (data) => ({
        url: "chat/group/create",
        method: "POST",
        body: data,
      }),
    }),
    addNewGroupMember: builder.mutation({
      query: (data) => ({
        url: `chat/group/add-member/${data?.groupId}`,
        method: "POST",
        body: data,
      }),
    }),
    removeGroupMember: builder.mutation({
      query: (data) => ({
        url: `chat/group/remove-member`,
        method: "DELETE",
        body: data,
      }),
    }),
    sendGroupMessage: builder.mutation({
      query: (data) => ({
        url: `chat/group/messages/${data?.groupId}`,
        method: "POST",
        body: data,
      }),
    }),
    getAllGroups: builder.query({
      query: () => `chat/group/all`,
    }),
    getMyGroups: builder.query({
      query: (userId) => `chat/group/my/${userId}`,
    }),
    getAllGroupMessages: builder.query({
      query: (groupId) => `chat/group/messages/${groupId}`,
    }),
    getAllGroupMembers: builder.query({
      query: (groupId) => `chat/group/get-members/${groupId}`,
    }),
  }),
});

export const {
  useAddMessageMutation,
  useChatsQuery,
  usePrivateChatsQuery,
  usePrivateMessagesQuery,
  useTopMembersQuery,
  useGetAllGroupsQuery,
  useAddNewGroupMutation,
  useAddNewGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetAllGroupMessagesQuery,
  useSendGroupMessageMutation,
  useGetAllGroupMembersQuery,
  useGetMyGroupsQuery,
} = chatSlices;
