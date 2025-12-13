import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const orgsSlices = createApi({
  reducerPath: "orgsSlices",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    organizations: builder.query({
      query: (code) => `organizations`,
    }),
  }),
});

export const { useOrganizationsQuery } = orgsSlices;
