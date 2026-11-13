import { createServer } from "@/lib/supabase/server";
import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TypedSupabaseServerClient = SupabaseClient<Database>;

export async function getSupabaseServerClient(): Promise<TypedSupabaseServerClient> {
  return (await createServer()) as TypedSupabaseServerClient;
}
