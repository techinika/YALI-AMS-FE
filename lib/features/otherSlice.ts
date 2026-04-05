import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const otherSlices = createApi({
  reducerPath: "otherSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Data"],
  endpoints: (builder) => ({
    gender: builder.query({
      query: (code) => `data/genders`,
    }),
    districts: builder.query({
      query: (code) => `data/districts`,
    }),
    countries: builder.query({
      query: (code) => `data/countries`,
    }),
    states: builder.query({
      query: (code) => `data/states`,
    }),
    statesByCountry: builder.query({
      query: (countryId) => `data/states/${countryId}`,
    }),
    cohorts: builder.query({
      query: (code) => `data/cohorts`,
    }),
    sectorsByDistrict: builder.query({
      query: (districtName) => `data/district/sector/${districtName}`,
    }),
    workingSector: builder.query({
      query: () => `data/working-sectors`,
    }),
    addWorkingSector: builder.mutation({
      query: (data) => ({
        url: "data/working-sectors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteWorkingSector: builder.mutation({
      query: (id) => ({
        url: `data/working-sector/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Data"],
    }),
    tracks: builder.query({
      query: () => `data/tracks`,
    }),
    addCohort: builder.mutation({
      query: (data) => ({
        url: "data/cohort",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteCohort: builder.mutation({
      query: (id) => ({
        url: `data/cohort/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Data"],
    }),
    addTrack: builder.mutation({
      query: (data) => ({
        url: "data/tracks",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteTrack: builder.mutation({
      query: (id) => ({
        url: `data/track/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Data"],
    }),
  }),
});

export const {
  useGenderQuery,
  useDistrictsQuery,
  useSectorsByDistrictQuery,
  useCohortsQuery,
  useWorkingSectorQuery,
  useTracksQuery,
  useCountriesQuery,
  useAddCohortMutation,
  useDeleteCohortMutation,
  useStatesQuery,
  useStatesByCountryQuery,
  useAddTrackMutation,
  useDeleteTrackMutation,
  useAddWorkingSectorMutation,
  useDeleteWorkingSectorMutation,
} = otherSlices;
