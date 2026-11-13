import { getSupabaseBrowserClient } from "./client";

export type ActivityTrendPoint = { date: string; count: number };

export type TopMember = {
  id: string;
  firstName: string;
  lastName: string;
  avatarPath: string | null;
  messageCount: number;
};

export async function listRecentActivity(limit = 10) {
  const supabase = getSupabaseBrowserClient();
  return supabase
    .from("activity_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
}

export async function listActivityTrend(days = 7): Promise<ActivityTrendPoint[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("dashboard_activity_trend", { p_days: days });
  if (error) throw error;
  return (data ?? []).map((row) => ({ date: row.day, count: Number(row.message_count) }));
}

export async function listTopMembers(limit = 3): Promise<TopMember[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("dashboard_top_members", { p_limit: limit });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarPath: row.avatar_path,
    messageCount: Number(row.message_count),
  }));
}