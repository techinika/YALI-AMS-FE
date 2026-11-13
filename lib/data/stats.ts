import { getSupabaseBrowserClient } from "./client";

export async function getDashboardStats() {
  const supabase = getSupabaseBrowserClient();
  const [users, messages, unopened, sent] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("status", "deleted"),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("opened", false),
    supabase.from("notifications").select("id", { count: "exact", head: true }),
  ]);
  return {
    users: users.count ?? 0,
    messages: messages.count ?? 0,
    notificationsUnopened: unopened.count ?? 0,
    sentNotifications: sent.count ?? 0,
  };
}
