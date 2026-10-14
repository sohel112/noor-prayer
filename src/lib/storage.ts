// Typed local storage — every user data point lives on the phone first.
// No account, no server needed for any of this.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  settings: 'noor.settings.v1',
  location: 'noor.location.v1',
  bookmarks: 'noor.bookmarks.v1',
  lastRead: 'noor.lastread.v1',
  tasbih: 'noor.tasbih.v1',
  prayerLog: 'noor.prayerlog.v1', // { 'YYYY-MM-DD': { fajr: true, ... } }
  qada: 'noor.qada.v1',           // { fajr: n, dhuhr: n, ... } missed counts
  fasting: 'noor.fasting.v1',     // { 'YYYY-MM-DD': 'shawwal' | 'monday' | ... }
  dhikrGoals: 'noor.dhikrgoals.v1',
  favorites: 'noor.favorites.v1', // dua ids
  hifz: 'noor.hifz.v1',           // { 's:a': 'memorized' | 'reading' }
  khatm: 'noor.khatm.v1',         // { 's:a': true }
  hijriAdjust: 'noor.hijriadjust.v1',
  onboarded: 'noor.onboarded.v1',
  backup: 'noor.backup.v1',
} as const;

export type StorageKey = keyof typeof KEYS;

export async function getJSON<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: StorageKey, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch {
    // storage full / unavailable — app keeps working in-memory
  }
}

export async function todayKey(d = new Date()): Promise<string> {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
