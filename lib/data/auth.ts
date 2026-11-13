import { getSupabaseBrowserClient } from "./client";

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.getSession();
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseBrowserClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/reset-password/recover`
      : undefined;
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.updateUser({ password });
}
