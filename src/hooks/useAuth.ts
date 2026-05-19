"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const GUEST_KEY = "meddraw:guest-nickname";

export type Identity = {
  nickname: string;
  userId: string | null;
  isGuest: boolean;
  loading: boolean;
};

export function useAuth(): Identity & {
  setGuestNickname: (n: string) => void;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<Identity>({
    nickname: "",
    userId: null,
    isGuest: true,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try Supabase session first
      if (isSupabaseConfigured) {
        try {
          const sb = createSupabaseBrowserClient();
          const { data } = await sb.auth.getUser();
          if (cancelled) return;
          if (data.user) {
            const profileNickname =
              (data.user.user_metadata?.full_name as string | undefined) ||
              data.user.email?.split("@")[0] ||
              "Player";
            setState({
              nickname: profileNickname,
              userId: data.user.id,
              isGuest: false,
              loading: false,
            });
            return;
          }
        } catch {
          // fall through to guest
        }
      }
      // Guest
      const stored = typeof window !== "undefined" ? localStorage.getItem(GUEST_KEY) : "";
      setState({
        nickname: stored || "",
        userId: null,
        isGuest: true,
        loading: false,
      });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setGuestNickname = useCallback((n: string) => {
    const clean = n.trim().slice(0, 20);
    if (typeof window !== "undefined") localStorage.setItem(GUEST_KEY, clean);
    setState((s) => ({ ...s, nickname: clean, isGuest: !s.userId }));
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const sb = createSupabaseBrowserClient();
      await sb.auth.signOut();
    }
    setState((s) => ({ ...s, userId: null, isGuest: true }));
  }, []);

  return { ...state, setGuestNickname, signOut };
}
