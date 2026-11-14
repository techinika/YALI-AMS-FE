import { getSupabaseBrowserClient } from "./client";

export async function getDashboardStats() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("dashboard_stats");
  if (error) throw error;
  const row = data?.[0];
  return {
    users: Number(row?.users ?? 0),
    messages: Number(row?.messages ?? 0),
    notificationsUnopened: Number(row?.notifications_unopened ?? 0),
    sentNotifications: Number(row?.sent_notifications ?? 0),
  };
}