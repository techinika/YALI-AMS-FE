import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { ApiResponse, WorkingSector } from "@/types/api";
import { Cohort } from "@/types/cohort";
import { Track } from "@/types/track";

const REF_CACHE_TTL = 300;

export const otherSlices = createApi({
  reducerPath: "otherSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "Countries",
    "States",
    "Districts",
    "Sectors",
    "Genders",
    "Cohorts",
    "Tracks",
    "WorkingSectors",
  ],
  endpoints: (builder) => ({
    gender: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/genders`,
      providesTags: ["Genders"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    districts: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/districts`,
      providesTags: ["Districts"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    countries: builder.query<{ data: { id: string; name: string }[] }, string | void>({
      query: () => `data/countries`,
      providesTags: ["Countries"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    states: builder.query<{ data: { id: string; name: string; countryCode: string }[] }, string | void>({
      query: () => `data/states`,
      providesTags: ["States"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    statesByCountry: builder.query<{ data: { id: string; name: string; countryCode: string }[] }, string>({
      query: (countryId) => `data/states/${countryId}`,
      providesTags: (_result, _error, countryId) => [{ type: "States", id: countryId }],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    cohorts: builder.query<{ data: Cohort[] }, string | void>({
      query: () => `data/cohorts`,
      providesTags: ["Cohorts"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    sectorsByDistrict: builder.query<{ data: { id: string; name: string }[] }, string>({
      query: (districtName) => `data/district/sector/${districtName}`,
      providesTags: (_result, _error, districtName) => [{ type: "Sectors", id: districtName }],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    workingSector: builder.query<{ data: WorkingSector[] }, string | void>({
      query: () => `data/working-sectors`,
      providesTags: ["WorkingSectors"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    addWorkingSector: builder.mutation<{ data: WorkingSector }, { name: string }>({
      query: (data) => ({
        url: "data/working-sectors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["WorkingSectors"],
    }),
    deleteWorkingSector: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `data/working-sector/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkingSectors"],
    }),
    tracks: builder.query<{ data: Track[] }, string | void>({
      query: () => `data/tracks`,
      providesTags: ["Tracks"],
      keepUnusedDataFor: REF_CACHE_TTL,
    }),
    addCohort: builder.mutation<{ data: Cohort }, { name: string }>({
      query: (data) => ({
        url: "data/cohort",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cohorts"],
    }),
    deleteCohort: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `data/cohort/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cohorts"],
    }),
    addTrack: builder.mutation<{ data: Track }, { name: string }>({
      query: (data) => ({
        url: "data/tracks",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tracks"],
    }),
    deleteTrack: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `data/track/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tracks"],
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
