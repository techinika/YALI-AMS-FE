import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { Organization } from "@/types/user";
import { ApiResponse, PaginatedResponse } from "@/types/api";

interface OrgUserData {
  userId: string;
  organizationId: string;
}

export const orgsSlices = createApi({
  reducerPath: "orgsSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Organizations"],
  endpoints: (builder) => ({
    organizations: builder.query<{ data: Organization[] }, void>({
      query: () => `organizations`,
      providesTags: ["Organizations"],
    }),
    getOrganizationById: builder.query<{ data: Organization }, string>({
      query: (id) => `organizations/${id}`,
    }),
    getOrganizationsForUser: builder.query<{ data: Organization[] }, string>({
      query: (id) => `organizations/user/${id}`,
      providesTags: ["Organizations"],
    }),
    getOrganizationsForUserById: builder.query<{ data: Organization }, { id: string; orgId: string }>({
      query: (data) => `organizations/user/${data?.id}/${data?.orgId}`,
    }),
    addNewOrganization: builder.mutation<{ data: Organization; message: string }, Partial<Organization>>({
      query: (data) => ({
        url: `organizations/new`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Organizations"],
    }),
    updateOrganization: builder.mutation<{ data: Organization; message: string }, Partial<Organization>>({
      query: (data) => ({
        url: `organizations/update`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Organizations"],
    }),
    addWStoOrg: builder.mutation<{ message: string }, { organizationId: string; workingSectorId: string }>({
      query: (data) => ({
        url: `organizations/ws/add`,
        method: "POST",
        body: data,
      }),
    }),
    removeWStoOrg: builder.mutation<{ message: string }, { organizationId: string; workingSectorId: string }>({
      query: (data) => ({
        url: `organizations/ws/remove`,
        method: "DELETE",
        body: data,
      }),
    }),
  }),
});

export const {
  useOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useGetOrganizationsForUserQuery,
  useAddNewOrganizationMutation,
  useAddWStoOrgMutation,
  useRemoveWStoOrgMutation,
  useUpdateOrganizationMutation,
  useGetOrganizationsForUserByIdQuery,
} = orgsSlices;
