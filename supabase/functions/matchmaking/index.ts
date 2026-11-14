// Interest matching.
//
// The AMS matches a member's interests against the rest of the community. When
// an embeddings provider is configured (MATCHMAKING_AI_KEY) the caller can pass
// `embedding`; otherwise the function falls back to deterministic scoring over
// `profiles.search_text`, track, cohort, district and sector.
//
// Input: { interests: string[], description?: string }
// Output: { requestId, summary, matches: [{ user, score, reason }] }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const STOP_WORDS = new Set(["and", "the", "for", "with", "from", "your", "into", "about"]);

function tokens(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

type Candidate = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  search_text: string | null;
  track_id: string | null;
  cohort_id: number | null;
  district_id: string | null;
  sector_id: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server is not configured" }, 500);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
    const me = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const interests = Array.isArray(body?.interests) ? body.interests.map((v: unknown) => String(v)).filter(Boolean).slice(0, 20) : [];
    const description = typeof body?.description === "string" ? body.description : "";

    if (interests.length === 0 && description.trim().length < 8) {
      return json({ error: "Select at least one interest or describe your goals." }, 400);
    }

    const { data: myProfile } = await admin
      .from("profiles")
      .select("id, track_id, cohort_id, district_id, sector_id")
      .eq("id", me)
      .maybeSingle();

    const { data: candidates, error: candidateError } = await admin
      .from("profiles")
      .select("id, first_name, last_name, avatar_path, search_text, track_id, cohort_id, district_id, sector_id")
      .neq("id", me)
      .neq("status", "deleted")
      .in("status", ["active", "inactive"])
      .limit(500);
    if (candidateError) return json({ error: candidateError.message }, 400);

    const interestTerms = Array.from(new Set([...interests.flatMap(tokens), ...tokens(description)]));
    const scored = (candidates ?? [])
      .map((candidate: Candidate) => {
        const haystack = (candidate.search_text ?? "").toLowerCase();
        const matchedInterests = interestTerms.filter((term) => haystack.includes(term));
        const shared: string[] = [];
        let score = matchedInterests.length * 30;

        if (matchedInterests.length) shared.push(`interests: ${Array.from(new Set(matchedInterests)).slice(0, 3).join(", ")}`);
        if (myProfile?.track_id && candidate.track_id === myProfile.track_id) {
          score += 20;
          shared.push("same track");
        }
        if (myProfile?.cohort_id && candidate.cohort_id === myProfile.cohort_id) {
          score += 15;
          shared.push("same cohort");
        }
        if (myProfile?.sector_id && candidate.sector_id === myProfile.sector_id) {
          score += 10;
          shared.push("same sector");
        }
        if (myProfile?.district_id && candidate.district_id === myProfile.district_id) {
          score += 5;
          shared.push("same district");
        }

        return {
          candidate,
          score: Math.min(100, score),
          reason: shared.join(" · "),
        };
      })
      .filter((entry) => entry.score >= 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const summary = interestTerms.length
      ? `Matched on ${Array.from(new Set(interestTerms)).slice(0, 5).join(", ")}.`
      : "Matched on shared track, cohort and location.";

    const { data: request, error: requestError } = await admin
      .from("matchmaking_requests")
      .insert({
        user_id: me,
        interests: interests.join(", ") || description.slice(0, 500),
        description: description || null,
        status: "completed",
        ai_summary: summary,
        ai_notes: "deterministic",
      } as never)
      .select("id")
      .single();
    if (requestError || !request) return json({ error: requestError?.message ?? "Could not save the request" }, 400);

    if (scored.length) {
      const { error: itemsError } = await admin.from("matchmaking_items").insert(
        scored.map((entry) => ({
          request_id: request.id,
          match_type: "user",
          matched_user_id: entry.candidate.id,
          score: entry.score,
          reason: entry.reason || null,
        })) as never
      );
      if (itemsError) return json({ error: itemsError.message }, 400);
    }

    return json({
      requestId: request.id,
      summary,
      matches: scored.map((entry) => ({
        user: {
          id: entry.candidate.id,
          first_name: entry.candidate.first_name,
          last_name: entry.candidate.last_name,
          avatar_path: entry.candidate.avatar_path,
        },
        score: entry.score,
        reason: entry.reason,
      })),
    });
  } catch (error) {
    console.error("matchmaking error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});