import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const orgsSlices = createApi({
  reducerPath: "orgsSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    organizations: builder.query({
      query: () => `organizations`,
    }),
    getOrganizationById: builder.query({
      query: (id) => `organizations/${id}`,
    }),
    getOrganizationsForUser: builder.query({
      query: (id) => `organizations/user/${id}`,
    }),
    addNewOrganization: builder.mutation({
      query: (data) => ({
        url: `organizations/new`,
        method: "POST",
        body: data,
      }),
    }),
    addWStoOrg: builder.mutation({
      query: (data) => ({
        url: `organizations/ws/add`,
        method: "POST",
        body: data,
      }),
    }),
    removeWStoOrg: builder.mutation({
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
} = orgsSlices;
