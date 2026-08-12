"use client";

import {
  useCountriesQuery,
  useDistrictsQuery,
  useGenderQuery,
  useCohortsQuery,
  useTracksQuery,
  useWorkingSectorQuery,
} from "@/lib/features/otherSlice";

export function RefDataPrefetcher() {
  useCountriesQuery("");
  useDistrictsQuery("");
  useGenderQuery("");
  useCohortsQuery("");
  useTracksQuery("");
  useWorkingSectorQuery("");

  return null;
}
