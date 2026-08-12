import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { Message, GroupMessage, Group } from "@/types/message";
import { Member } from "@/types/user";
import { TopMember } from "@/types/api";

interface PrivateChat {
  id: string;
  otherUser: Member;
  lastMessage: string;
  updatedAt: string;
}

interface SendMessageData {
  senderId: string;
  receiverId: string;
  message: string;
}

interface CreateGroupData {
  name: string;
  createdById: string;
}

interface GroupMemberData {
  groupId: string;
  userId: string;
}

interface GroupMessageData {
  groupId: string;
  userId: string;
  content: string;
  senderId: string;
}

interface UsersToInviteData {
  currentUserId: string;
  activeGroupId: string;
}

export const chatSlices = createApi({
  reducerPath: "chatSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    chats: builder.query<{ data: Message[] }, void>({
      query: () => `chat`,
    }),
    topMembers: builder.query<{ data: TopMember[] }, void>({
      query: () => `chat/top`,
    }),
    addMessage: builder.mutation<{ data: Message }, SendMessageData>({
      query: (credentials) => ({
        url: "chat",
        method: "POST",
        body: credentials,
      }),
    }),
    privateChats: builder.query<{ data: PrivateChat[] }, string>({
      query: (id) => `chat/${id}`,
    }),
    privateMessages: builder.query<{ data: Message[] }, { id: string; oid: string }>({
      query: (data) => `chat/${data?.id}/${data?.oid}`,
    }),
    addNewGroup: builder.mutation<{ data: Group }, CreateGroupData>({
      query: (data) => ({
        url: "chat/group/create",
        method: "POST",
        body: data,
      }),
    }),
    addNewGroupMember: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/add-member/${data?.groupId}`,
        method: "POST",
        body: data,
      }),
    }),
    removeGroupMember: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/remove-member`,
        method: "DELETE",
        body: data,
      }),
    }),
    requestToJoinGroup: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/join-request`,
        method: "POST",
        body: data,
      }),
    }),
    approveGroupJoinRequest: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/approve-request/admin`,
        method: "POST",
        body: data,
      }),
    }),
    acceptGroupInvitation: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/approve-request/member`,
        method: "POST",
        body: data,
      }),
    }),
    rejectJoinRequest: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/reject-request/${data?.groupId}`,
        method: "POST",
        body: data,
      }),
    }),
    declineGroupInvitation: builder.mutation<{ message: string }, GroupMemberData>({
      query: (data) => ({
        url: `chat/group/decline-request/${data?.groupId}`,
        method: "POST",
        body: data,
      }),
    }),
    sendGroupMessage: builder.mutation<{ data: GroupMessage }, GroupMessageData>({
      query: (data) => ({
        url: `chat/group/messages/${data?.groupId}/${data?.userId}`,
        method: "POST",
        body: data,
      }),
    }),
    getAllGroups: builder.query<{ data: Group[] }, void>({
      query: () => `chat/group/all`,
    }),
    getUsersToInvite: builder.query<{ data: Member[] }, UsersToInviteData>({
      query: (data) =>
        `chat/group/to-invite/${data?.currentUserId}/${data?.activeGroupId}`,
    }),
    getMyGroups: builder.query<{ data: Group[] }, string>({
      query: (userId) => `chat/group/my/${userId}`,
    }),
    getAllGroupMessages: builder.query<{ data: GroupMessage[] }, { groupId: string; userId: string }>({
      query: (data) => `chat/group/messages/${data?.groupId}/${data?.userId}`,
    }),
    getAllGroupMembers: builder.query<{ data: Array<{ id: string; userId: string; groupId: string; status: string; user: Member }> }, string>({
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
  useRequestToJoinGroupMutation,
  useAcceptGroupInvitationMutation,
  useApproveGroupJoinRequestMutation,
  useDeclineGroupInvitationMutation,
  useRejectJoinRequestMutation,
  useGetUsersToInviteQuery,
} = chatSlices;
