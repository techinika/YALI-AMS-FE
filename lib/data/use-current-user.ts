"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

export type CurrentUser = {
  user: User | null;
  loading: boolean;
  role: string | null;
};

/**
 * Resolves the signed-in Supabase user together with their profile role.
 *
 * The role is read from `profiles.role` (not the JWT) because that is what the
 * row level security helpers use, so admin-only UI and database permissions
 * always agree.
 */
export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    const resolve = async (nextUser: User | null) => {
      if (!mounted) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", nextUser.id).maybeSingle();
      if (!mounted) return;
      const nextRole =
        (data?.role as string | undefined) ??
        (nextUser.app_metadata?.role as string | undefined) ??
        (nextUser.user_metadata?.role as string | undefined) ??
        null;
      setRole(nextRole ? nextRole.toLowerCase() : null);
      setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => resolve(data.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, role };
}