import { getSupabaseBrowserClient } from "./client";

const ORG_SELECT = `
  id, name, website, country_id, district_id, sector_id, state_id, added_by, created_at, updated_at,
  country:countries(id, name),
  district:districts(id, name),
  sector:sectors(id, name),
  state:states(id, name),
  organization_working_sectors(working_sector:working_sectors(id, name))
`;

export type OrganizationInput = {
  name: string;
  website?: string | null;
  countryId?: string | null;
  districtId?: string | null;
  sectorId?: string | null;
  stateId?: string | null;
};

function emptyToNull(v?: string | null) {
  return v === "" || v === undefined ? null : v;
}

export function mapOrganizationRow(row: any): any {
  if (!row) return row;
  const ws =
    row.organization_working_sectors?.map((x: any) => x.working_sector).filter(Boolean) ??
    row.workingSectors ??
    [];
  return {
    ...row,
    countryId: row.country_id ?? row.country?.id ?? null,
    districtId: row.district_id ?? row.district?.id ?? null,
    sectorId: row.sector_id ?? row.sector?.id ?? null,
    stateId: row.state_id ?? row.state?.id ?? null,
    workingSectors: ws,
  };
}

export async function listOrganizations() {
  const supabase = getSupabaseBrowserClient();
  const res = await supabase.from("organizations").select(ORG_SELECT).order("name");
  return { ...res, data: (res.data ?? []).map(mapOrganizationRow) };
}

export async function getOrganizationById(id: string) {
  const supabase = getSupabaseBrowserClient();
  const res = await supabase.from("organizations").select(ORG_SELECT).eq("id", id).maybeSingle();
  return { ...res, data: res.data ? mapOrganizationRow(res.data) : res.data };
}

export async function listUserOrganizations(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const res = await supabase
    .from("user_organizations")
    .select(
      `id, user_id, organization_id, relation, position, created_at, updated_at,
       organization:organizations(${ORG_SELECT}),
       user_organization_working_sectors(working_sector:working_sectors(id, name))`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const data = (res.data ?? []).map((row: any) => {
    const org = mapOrganizationRow(row.organization);
    const linkSectors = row.user_organization_working_sectors?.map((x: any) => x.working_sector).filter(Boolean) ?? [];
    return {
      ...org,
      ...row,
      id: org?.id ?? row.organization_id,
      connectId: row.id,
      user: row.user_id,
      userId: row.user_id,
      relation: row.relation,
      position: row.position ?? "",
      workingSectors: linkSectors.length ? linkSectors : org?.workingSectors ?? [],
      organization: org,
    };
  });
  return { ...res, data };
}

export async function createOrganization(input: OrganizationInput & { addedById?: string | null }) {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("organizations")
    .insert({
      name: input.name,
      website: emptyToNull(input.website),
      country_id: emptyToNull(input.countryId),
      district_id: emptyToNull(input.districtId),
      sector_id: emptyToNull(input.sectorId),
      state_id: emptyToNull(input.stateId),
      added_by: emptyToNull(input.addedById),
    })
    .select(ORG_SELECT)
    .single();
}

export async function updateOrganization(id: string, input: OrganizationInput) {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("organizations")
    .update({
      name: input.name,
      website: emptyToNull(input.website),
      country_id: emptyToNull(input.countryId),
      district_id: emptyToNull(input.districtId),
      sector_id: emptyToNull(input.sectorId),
      state_id: emptyToNull(input.stateId),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ORG_SELECT)
    .single();
}

export async function setOrganizationWorkingSectors(organizationId: string, workingSectorIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  const { error: delError } = await supabase
    .from("organization_working_sectors")
    .delete()
    .eq("organization_id", organizationId);
  if (delError) return { error: delError };
  if (!workingSectorIds.length) return { error: null };
  const rows = workingSectorIds.map((id) => ({ organization_id: organizationId, working_sector_id: id }));
  return supabase.from("organization_working_sectors").insert(rows);
}

export async function associateUserToOrganization(input: {
  userId: string;
  organizationId: string;
  relation?: string;
  position?: string | null;
}) {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("user_organizations")
    .upsert(
      {
        user_id: input.userId,
        organization_id: input.organizationId,
        relation: input.relation || "founded",
        position: emptyToNull(input.position),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,organization_id" }
    )
    .select("id, user_id, organization_id, relation, position")
    .single();
}

export async function setUserOrganizationWorkingSectors(
  userId: string,
  organizationId: string,
  workingSectorIds: string[]
) {
  const supabase = getSupabaseBrowserClient();
  const { error: delError } = await supabase
    .from("user_organization_working_sectors")
    .delete()
    .eq("user_id", userId)
    .eq("organization_id", organizationId);
  if (delError) return { error: delError };
  if (!workingSectorIds.length) return { error: null };
  const rows = workingSectorIds.map((id) => ({
    user_id: userId,
    organization_id: organizationId,
    working_sector_id: id,
  }));
  return supabase.from("user_organization_working_sectors").insert(rows);
}

export async function removeUserOrganization(connectionId?: string, userId?: string, organizationId?: string) {
  const supabase = getSupabaseBrowserClient();
  if (userId && organizationId) {
    await supabase
      .from("user_organization_working_sectors")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId);
  }
  let q = supabase.from("user_organizations").delete();
  if (connectionId) q = q.eq("id", connectionId);
  else if (userId && organizationId) q = q.eq("user_id", userId).eq("organization_id", organizationId);
  else return { error: new Error("Missing identifiers for removeUserOrganization") };
  return q;
}
