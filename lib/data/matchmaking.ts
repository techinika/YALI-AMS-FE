import { getSupabaseBrowserClient } from "./client";

export type MatchUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

export type MatchResult = { user: MatchUser; score: number; reason: string };

export type MatchmakingRequest = {
  id: string;
  interests: string;
  description: string | null;
  status: string;
  ai_summary: string | null;
  created_at: string;
  items: { id: string; score: number | null; reason: string | null; profile: MatchUser | null }[];
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.functions.invoke("matchmaking", { body });
  if (error) {
    let message = error.message;
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (context?.json) {
      try {
        const payload = (await context.json()) as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        // keep original
      }
    }
    throw new Error(message);
  }
  const result = data as (T & { error?: string }) | null;
  if (!result) throw new Error("The matcher returned an empty response.");
  if (result.error) throw new Error(result.error);
  return result;
}

export async function runMatchmaking(interests: string[], description: string) {
  return invoke<{ requestId: string; summary: string; matches: MatchResult[] }>({
    interests,
    description,
  });
}

export async function listMatchmakingHistory(limit = 8) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("matchmaking_requests")
    .select(
      `id, interests, description, status, ai_summary, created_at,
       items:matchmaking_items(id, score, reason, profile:profiles!matchmaking_items_matched_user_id_fkey(id, first_name, last_name, avatar_path))`
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as MatchmakingRequest[];
}