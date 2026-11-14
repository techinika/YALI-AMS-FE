"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  listCountries,
  listDistricts,
  listGenders,
  listCohorts,
  listTracks,
  listWorkingSectors,
} from "@/lib/data/reference";

export function RefDataPrefetcher() {
  const qc = useQueryClient();
  useEffect(() => {
    const tasks: [string[], () => Promise<any>][] = [
      [["ref", "countries"], listCountries],
      [["ref", "districts"], listDistricts],
      [["ref", "genders"], listGenders],
      [["ref", "cohorts"], listCohorts],
      [["ref", "tracks"], listTracks],
      [["ref", "working_sectors"], listWorkingSectors],
    ];
    for (const [key, fn] of tasks) qc.prefetchQuery({ queryKey: key, queryFn: async () => (await fn()).data ?? [] });
  }, [qc]);
  return null;
}
