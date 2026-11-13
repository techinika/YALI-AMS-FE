import { getSupabaseBrowserClient } from "./client";

export async function listRecentActivity(limit = 10) {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("activity_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
}
