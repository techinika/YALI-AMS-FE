import { getSupabaseBrowserClient } from "./client";

export async function listMyNotifications() {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
}

export async function markNotificationOpened(id: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.from("notifications").update({ opened: true }).eq("id", id);
}
