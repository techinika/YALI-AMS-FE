import { getSupabaseBrowserClient } from "./client";

export async function listCountries() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("countries").select("*").order("name");
}

export async function listDistricts() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("districts").select("*").order("name");
}

export async function listSectorsByDistrict(districtId: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("sectors").select("*").eq("district_id", districtId).order("name");
}

export async function listStatesByCountry(countryId: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("states").select("*").eq("country_code", countryId).order("name");
}

export async function listGenders() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("genders").select("*").order("id");
}

export async function listCohorts() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("cohorts").select("*").order("id");
}

export async function listTracks() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("tracks").select("*").order("name");
}

export async function listWorkingSectors() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("working_sectors").select("*").order("name");
}
