import { getSupabaseBrowserClient } from "./client";
import type { TablesUpdate } from "./types";

export type CohortRow = {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
};

export type TrackRow = { id: string; name: string; created_at: string };
export type WorkingSectorRow = { id: string; name: string; created_at: string };
export type NotificationTemplateRow = {
  id: string;
  usage: string;
  message: string;
  link: string | null;
  updated_at: string;
};

const DEFAULT_REFERENCE_NAME = "Not Specified";

export function isDefaultReference(name?: string | null) {
  return (name ?? "").trim().toLowerCase() === DEFAULT_REFERENCE_NAME.toLowerCase();
}

export async function listCohortsAdmin() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("cohorts").select("id, name, description, created_at").order("id");
}

export async function createCohort(input: { name: string; description?: string | null }) {
  const supabase = getSupabaseBrowserClient();
  const name = input.name.trim();
  if (!name) throw new Error("Cohort name is required.");
  const { data, error } = await supabase
    .from("cohorts")
    .insert({ name, description: input.description?.trim() || null })
    .select("id, name, description, created_at")
    .single();
  if (error) throw error;
  return data as CohortRow;
}

export async function deleteCohort(id: number) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("cohorts").delete().eq("id", id);
}

export async function listTracksAdmin() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("tracks").select("id, name, created_at").order("name");
}

export async function createTrack(input: { name: string }) {
  const supabase = getSupabaseBrowserClient();
  const name = input.name.trim();
  if (!name) throw new Error("Track name is required.");
  const { data, error } = await supabase
    .from("tracks")
    .insert({ name })
    .select("id, name, created_at")
    .single();
  if (error) throw error;
  return data as TrackRow;
}

export async function deleteTrack(id: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("tracks").delete().eq("id", id);
}

export async function listWorkingSectorsAdmin() {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("working_sectors").select("id, name, created_at").order("name");
}

export async function createWorkingSector(input: { name: string }) {
  const supabase = getSupabaseBrowserClient();
  const name = input.name.trim();
  if (!name) throw new Error("Working sector name is required.");
  const { data, error } = await supabase
    .from("working_sectors")
    .insert({ name })
    .select("id, name, created_at")
    .single();
  if (error) throw error;
  return data as WorkingSectorRow;
}

export async function deleteWorkingSector(id: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("working_sectors").delete().eq("id", id);
}

export async function listNotificationTemplates() {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("notification_templates")
    .select("id, usage, message, link, updated_at")
    .order("usage");
}

export async function updateNotificationTemplate(
  id: string,
  input: { message: string; usage?: string; link?: string | null }
) {
  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const patch: TablesUpdate<"notification_templates"> = {
    message: input.message,
    link: input.link ?? null,
  };
  if (input.usage) patch.usage = input.usage;
  if (auth.user) patch.updated_by = auth.user.id;
  return supabase.from("notification_templates").update(patch).eq("id", id);
}

export { DEFAULT_REFERENCE_NAME };