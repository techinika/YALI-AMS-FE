import { getSupabaseBrowserClient } from "./client";
import type { Tables } from "./types";

export type Profile = Tables<"profiles">;

const PROFILE_LIST_SELECT = `
  id, first_name, middle_name, last_name, email, bio, linkedin, instagram, facebook, twitter,
  gender_id, is_rwandan, country_id, state_id, district_id, sector_id, nearest_landmark,
  cohort_id, track_id, avatar_path, role, status, phone_visible, whatsapp_visible, created_at, updated_at,
  cohort:cohorts(id, name, description),
  track:tracks(id, name),
  resident_country:countries!profiles_country_id_fkey(id, name),
  resident_district:districts!profiles_district_id_fkey(id, name),
  resident_sector:sectors!profiles_sector_id_fkey(id, name),
  resident_state:states!profiles_state_id_fkey(id, name),
  gender:genders(id, name)
`;

export async function getMyProfile() {
  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { data: null, error: new Error("Not authenticated") };
  return supabase.from("profiles").select(PROFILE_LIST_SELECT).eq("id", auth.user.id).maybeSingle();
}

export async function getProfileById(id: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("profiles").select(PROFILE_LIST_SELECT).eq("id", id).maybeSingle();
}

export async function listProfiles(opts?: { page?: number; limit?: number; search?: string }) {
  const supabase = getSupabaseBrowserClient();
  const page = Math.max(1, opts?.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let q = supabase
    .from("profiles")
    .select(PROFILE_LIST_SELECT, { count: "exact" })
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .range(from, to);
  const search = opts?.search?.trim().replace(/[,()"\\]/g, " ");
  if (search) {
    q = q.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,search_text.ilike.%${search}%`
    );
  }
  return q;
}

export async function deleteProfile(id: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("profiles").update({ status: "deleted" }).eq("id", id);
}

export function profileToMember(p: any): any {
  if (!p) return p;
  return {
    ...p,
    firstName: p.first_name,
    middleName: p.middle_name ?? "",
    lastName: p.last_name,
    phoneNumber: p.phone ?? "",
    whatsappNumber: p.whatsapp ?? "",
    genderName: p.gender?.name ?? "",
    gender: p.gender ?? null,
    genderId: p.gender_id ?? null,
    trackId: p.track_id ?? null,
    stateId: p.state_id ?? null,
    districtId: p.district_id ?? null,
    sectorId: p.sector_id ?? null,
    nearestLandmark: p.nearest_landmark,
    residentDistrictId: p.district_id,
    residentCountryId: p.country_id,
    residentDistrict: p.resident_district ? { id: p.resident_district.id, name: p.resident_district.name } : null,
    residentCountry: p.resident_country ? { id: p.resident_country.id, name: p.resident_country.name } : null,
    residentSector: p.resident_sector ? { id: p.resident_sector.id, name: p.resident_sector.name } : null,
    residentSectorId: p.sector_id,
    state: p.resident_state ?? null,
    cohort: p.cohort ?? null,
    cohortId: p.cohort_id,
    track: p.track ?? null,
    role: { id: p.role, name: String(p.role || "").toUpperCase() },
    profileImage: p.avatar_path ? { id: p.avatar_path, link: p.avatar_path, name: p.avatar_path } : null,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
