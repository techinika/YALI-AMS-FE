import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  return createClient() as TypedSupabaseClient;
}
