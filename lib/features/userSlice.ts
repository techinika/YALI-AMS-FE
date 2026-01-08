import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const usersSlices = createApi({
  reducerPath: "usersSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    users: builder.query({
      query: () => `users`,
    }),
    getOneUser: builder.query({
      query: (userId) => `users/${userId}`,
    }),
    change: builder.mutation({
      query: (userId) => ({
        url: `users/role/${userId}`,
        method: "POST",
      }),
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `users/${userId}`,
        method: "DELETE",
      }),
    }),
    updatedUser: builder.mutation({
      query: (data) => ({
        url: `users/${data?.userId}`,
        method: "PUT",
        body: {
          user: data?.user,
        },
      }),
    }),
    inviteUser: builder.mutation({
      query: (body) => ({
        url: "users/invite",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    reInviteUser: builder.mutation({
      query: (body) => ({
        url: `users/invite/renew/${body.id}`,
        method: "PUT",
      }),
    }),
    createUserProfile: builder.mutation({
      query: (credentials) => ({
        url: "users/profile",
        method: "POST",
        body: credentials,
      }),
    }),
    uploadPicture: builder.mutation({
      query: (credentials) => ({
        url: "upload/image",
        method: "POST",
        body: credentials,
      }),
    }),
    importUsers: builder.mutation({
      query: (data) => ({
        url: "upload/users",
        method: "POST",
        body: data,
      }),
    }),
    exportUsers: builder.mutation({
      query: () => ({
        url: "users/export/all",
        method: "POST",
      }),
    }),
    associateOrganization: builder.mutation({
      query: (data) => ({
        url: "users/org/add",
        method: "POST",
        body: data,
      }),
    }),
    removeUserOrganization: builder.mutation({
      query: (data) => ({
        url: "users/org/remove",
        method: "DELETE",
        body: data,
      }),
    }),
  }),
});

export const {
  useUsersQuery,
  useGetOneUserQuery,
  useDeleteUserMutation,
  useUpdatedUserMutation,
  useUploadPictureMutation,
  useChangeMutation,
  useImportUsersMutation,
  useCreateUserProfileMutation,
  useInviteUserMutation,
  useAssociateOrganizationMutation,
  useRemoveUserOrganizationMutation,
  useReInviteUserMutation,
  useExportUsersMutation,
} = usersSlices;
