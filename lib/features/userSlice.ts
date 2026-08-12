import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { Member } from "@/types/user";
import {
  ApiResponse,
  InviteUserData,
  ImportUsersData,
  UpdateUserData,
  OrgUserData,
} from "@/types/api";

interface CreateUserProfileData {
  user: Omit<Partial<Member>, "cohortId"> & {
    trackId?: string | null;
    stateId?: string | null;
    countryId?: string | null;
    genderId?: string | null;
    profileImageId?: string | null;
    cohortId?: number | null | string;
  };
}

interface InsertExistingOrgData {
  userId: string;
  mode: string;
  existingOrganizationId: number;
  associationType: string;
}

interface InsertNewOrgData {
  userId: string;
  mode: string;
  associationType: string;
  newOrganizationData: {
    name: string;
    workingSectorId: string | null;
    website: string | null;
    countryId: string | null;
    stateId: string | null;
    districtId: string | null;
    sectorId: string | null;
  };
}

export const usersSlices = createApi({
  reducerPath: "usersSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    users: builder.query<{ data: Member[]; count: number; message: string }, void>({
      query: () => `users`,
    }),
    getOneUser: builder.query<{ data: Member }, string>({
      query: (userId) => `users/${userId}`,
    }),
    change: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `users/role/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    updatedUser: builder.mutation<{ message: string; data: Member }, UpdateUserData>({
      query: (data) => ({
        url: `users/${data?.userId}`,
        method: "PUT",
        body: {
          user: data?.user,
        },
      }),
      invalidatesTags: ["Users"],
    }),
    inviteUser: builder.mutation<{ message: string }, InviteUserData>({
      query: (body) => ({
        url: "users/invite",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    reInviteUser: builder.mutation<{ message: string }, { id: string }>({
      query: (body) => ({
        url: `users/invite/renew/${body.id}`,
        method: "PUT",
      }),
    }),
    createUserProfile: builder.mutation<{ message: string; user: Member }, CreateUserProfileData>({
      query: (credentials) => ({
        url: "users/profile",
        method: "POST",
        body: credentials,
      }),
    }),
    uploadPicture: builder.mutation<{ image: { id: string; link: string } }, FormData>({
      query: (credentials) => ({
        url: "upload/image",
        method: "POST",
        body: credentials,
      }),
    }),
    importUsers: builder.mutation<{ message: string }, ImportUsersData>({
      query: (data) => ({
        url: "users/import",
        method: "POST",
        body: data,
      }),
    }),
    exportUsers: builder.mutation<{ success: boolean; downloadUrl: string }, void>({
      query: () => ({
        url: "users/export/all",
        method: "POST",
      }),
    }),
    associateOrganization: builder.mutation<{ message: string }, OrgUserData | InsertExistingOrgData | InsertNewOrgData>({
      query: (data) => ({
        url: "users/org/add",
        method: "POST",
        body: data,
      }),
    }),
    removeUserOrganization: builder.mutation<{ message: string }, OrgUserData>({
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
