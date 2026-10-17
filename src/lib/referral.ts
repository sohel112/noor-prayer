// Deen — Referral system library
// Handles referral codes, sharing, leaderboard, and district detection.

import { Share } from 'react-native';
import { getSupabase } from './supabase';
import { getJSON, setJSON } from './storage';

export async function getMyReferralCode(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('referral_code').eq('id', user.id).single();
  if (data?.referral_code) return data.referral_code;
  const { data: code } = await sb.rpc('generate_referral_code');
  if (code) {
    await sb.from('profiles').update({ referral_code: code }).eq('id', user.id);
    return code;
  }
  return null;
}

export async function claimReferral(code: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const clean = code.trim().toUpperCase();
  if (!clean) return false;
  const { data, error } = await sb.rpc('claim_referral', { code: clean });
  if (error) return false;
  return data === true;
}

export async function getMyReferralCount(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return 0;
  const { data } = await sb.from('profiles').select('referral_count').eq('id', user.id).single();
  return data?.referral_count ?? 0;
}

const DISTRICT_KEY = 'userDistrict';
const DISTRICT_MANUAL_KEY = 'userDistrictManual';

export async function detectDistrict(): Promise<string | null> {
  try {
    const manual = await getJSON<string>(DISTRICT_MANUAL_KEY);
    if (manual) return manual;
    const cached = await getJSON<string>(DISTRICT_KEY);
    // Return cached immediately to avoid Location crashes on Settings/Leaderboard open.
    // Location-based detection only runs when explicitly requested.
    if (cached) return cached;
    return null;
  } catch {
    return null;
  }
}

export async function setDistrictManual(district: string): Promise<void> {
  await setJSON(DISTRICT_MANUAL_KEY, district);
  await setJSON(DISTRICT_KEY, district);
  const sb = getSupabase();
  if (sb) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.from('profiles').update({ district }).eq('id', user.id);
  }
}

export interface LeaderboardEntry {
  user_id: string;
  referral_code: string;
  district: string | null;
  referral_count: number;
  rank: number;
}

export async function getLeaderboard(district?: string | null, limit = 50): Promise<LeaderboardEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('profiles').select('id, referral_code, district, referral_count').gt('referral_count', 0).order('referral_count', { ascending: false }).limit(limit);
  if (district) query = query.eq('district', district);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((p: any, i: number) => ({
    user_id: p.id, referral_code: p.referral_code, district: p.district,
    referral_count: p.referral_count, rank: i + 1,
  }));
}

const SHARE_MESSAGES: Record<string, string> = {
  en: 'Share Deen with the intention of earning reward! 🕌\n\nDeen: Prayer times, Quran, Duas & more — all free!\n\nUse my referral code: {code}\n\nDownload: https://github.com/sohel112/noor-prayer/releases',
  hi: 'Sawab ki niyat se Deen share karo! 🕌\n\nDeen: Namaz ke times, Quran, Duas aur bahut kuch — bilkul free!\n\nMera referral code use karo: {code}\n\nDownload: https://github.com/sohel112/noor-prayer/releases',
  ur: 'Sawab ki niyat se Deen share karein! 🕌\n\nDeen: Namaz ke auqaat, Quran, Duayein aur bahut kuch — bilkul muft!\n\nMera referral code istemal karein: {code}\n\nDownload: https://github.com/sohel112/noor-prayer/releases',
};

export async function shareApp(lang = 'en', requireLogin = true): Promise<'shared' | 'login_required' | 'error'> {
  const sb = getSupabase();
  if (!sb) return 'error';
  const { data: { user } } = await sb.auth.getUser();
  if (requireLogin && !user) return 'login_required';
  const code = await getMyReferralCode();
  const template = SHARE_MESSAGES[lang] ?? SHARE_MESSAGES.en;
  const message = template.replace('{code}', code ?? '');
  try {
    await Share.share({ message, title: 'Share Deen 🕌' });
    return 'shared';
  } catch {
    return 'error';
  }
}
