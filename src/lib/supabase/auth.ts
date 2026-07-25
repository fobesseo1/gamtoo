"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

/** Redirects the browser to Google's consent screen; Supabase handles the
 * callback and lands the user back at `redirectTo` with a session already
 * established (the client SDK auto-detects it from the URL). This is a full
 * navigation, not a popup, so any in-memory state on the calling page is
 * gone when the user returns -- callers that need to resume something
 * after login must stash it themselves (see make/page.tsx's pending-save
 * flow) before calling this. */
export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export function signOut(): Promise<void> {
  return supabase.auth.signOut().then(() => undefined);
}

/** Reactive current-user hook. `loading` is true only for the initial
 * session check -- after that, `user` updates live via onAuthStateChange
 * (covers login, logout, and token refresh). */
export function useSupabaseUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
