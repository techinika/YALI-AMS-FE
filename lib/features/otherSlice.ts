import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { ApiResponse, WorkingSector } from "@/types/api";
import { Cohort } from "@/types/cohort";
import { Track } from "@/types/track";

export const otherSlices = createApi({
  reducerPath: "otherSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Data"],
  endpoints: (builder) => ({
    gender: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/genders`,
      providesTags: ["Data"],
    }),
    districts: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/districts`,
      providesTags: ["Data"],
    }),
    countries: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/countries`,
      providesTags: ["Data"],
    }),
    states: builder.query<{ data: { id: string; name: string; countryCode: string }[] }, string | void>({
      query: () => `data/states`,
      providesTags: ["Data"],
    }),
    statesByCountry: builder.query<{ data: { id: string; name: string; countryCode: string }[] }, string>({
      query: (countryId) => `data/states/${countryId}`,
      providesTags: ["Data"],
    }),
    cohorts: builder.query<{ data: Cohort[] }, string | void>({
      query: () => `data/cohorts`,
      providesTags: ["Data"],
    }),
    sectorsByDistrict: builder.query<{ data: { id: string; name: string }[] }, string>({
      query: (districtName) => `data/district/sector/${districtName}`,
      providesTags: ["Data"],
    }),
    workingSector: builder.query<{ data: WorkingSector[] }, string | void>({
      query: () => `data/working-sectors`,
      providesTags: ["Data"],
    }),
    addWorkingSector: builder.mutation<{ data: WorkingSector }, { name: string }>({
      query: (data) => ({
        url: "data/working-sectors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteWorkingSector: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `data/working-sector/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Data"],
    }),
    tracks: builder.query<{ data: Track[] }, string | void>({
      query: () => `data/tracks`,
    }),
    addCohort: builder.mutation<{ data: Cohort }, { name: string }>({
      query: (data) => ({
        url: "data/cohort",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteCohort: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `data/cohort/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Data"],
    }),
    addTrack: builder.mutation<{ data: Track }, { name: string }>({
      query: (data) => ({
        url: "data/tracks",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Data"],
    }),
    deleteTrack: builder.mutation<{ message: string }, string>({
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
