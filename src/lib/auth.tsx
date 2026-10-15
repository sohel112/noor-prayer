// Auth state — optional account for cloud backup. The app never requires login.
// Email/password works out of the box; Google OAuth needs Supabase dashboard setup (see README).

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthResult {
  error?: string;
  /** Sign-up only: true when the user must confirm via email before a session exists. */
  needsConfirm?: boolean;
}

interface AuthState {
  /** False until real Supabase credentials are configured by the owner. */
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  configured: false,
  loading: true,
  session: null,
  user: null,
  signIn: async () => ({ error: 'not configured' }),
  signUp: async () => ({ error: 'not configured' }),
  signInWithGoogle: async () => ({ error: 'not configured' }),
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

const redirectTo = Linking.createURL('auth/callback');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: 'Cloud backup is not set up yet.' };
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: friendlyError(error.message) } : {};
  };

  const signUp = async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { error: 'Cloud backup is not set up yet.' };
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) return { error: friendlyError(error.message) };
    // If email confirmation is on, there is no session yet.
    return data.session ? {} : { needsConfirm: true };
  };

  const signInWithGoogle = async () => {
    const sb = getSupabase();
    if (!sb) return { error: 'Cloud backup is not set up yet.' };
    try {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) return { error: error?.message ?? 'Could not start Google sign-in.' };
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success' || !res.url) return { error: 'Sign-in was cancelled.' };
      // The redirect URL carries the session in the fragment; Supabase parses it.
      if (Platform.OS !== 'web') {
        const { error: sessErr } = await sb.auth.getSession();
        if (sessErr) return { error: sessErr.message };
      }
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Google sign-in failed.' };
    }
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ configured, loading, session, user: session?.user ?? null, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Wrong email or password.';
  if (m.includes('already registered') || m.includes('already exists')) return 'This email already has an account — try signing in.';
  if (m.includes('password')) return 'Password must be at least 6 characters.';
  if (m.includes('email')) return 'Please enter a valid email address.';
  return msg;
}
