// Typed local storage — every user data point lives on the phone first.
// No account, no server needed for any of this.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  settings: 'noor.settings.v1',
  analytics_install_id: 'noor.analytics_install_id.v1',
  analytics_opt_out: 'noor.analytics_opt_out.v1',
  location: 'noor.location.v1',
  bookmarks: 'noor.bookmarks.v1',
  lastRead: 'noor.lastread.v1',
  tasbih: 'noor.tasbih.v1',
  prayerLog: 'noor.prayerlog.v1', // { 'YYYY-MM-DD': { fajr: true, ... } }
  qada: 'noor.qada.v1',           // { fajr: n, dhuhr: n, ... } missed counts
  uzrDays: 'noor.uzrdays.v1',     // { 'YYYY-MM-DD': true } — excused days (e.g. menstruation); don't break streak
  fasting: 'noor.fasting.v1',     // { 'YYYY-MM-DD': 'shawwal' | 'monday' | ... }
  dhikrGoals: 'noor.dhikrgoals.v1',
  favorites: 'noor.favorites.v1', // dua ids
  hifz: 'noor.hifz.v1',           // { 's:a': 'memorized' | 'reading' }
  khatm: 'noor.khatm.v1',         // { 's:a': true }
  hijriAdjust: 'noor.hijriadjust.v1',
  onboarded: 'noor.onboarded.v1',
  backup: 'noor.backup.v1',
  azanSetupDismissed: 'noor.azansetupdismissed.v1',
  syncMeta: 'noor.syncmeta.v1', // { lastSync, lastError } for cloud backup
  notifPrefs: 'noor.notifprefs.v1', // { prayerAlerts, adhan, dailyReminder, ... }
  fontSize: 'noor.fontsize.v1', // 'small' | 'medium' | 'large'
  fajrAlarm: 'noor.fajralarm.v1', // { enabled, hour, minute }
  readingStreak: 'noor.readingStreak.v1', // { dates: string[] } YYYY-MM-DD Quran reading days
  hifzRev: 'noor.hifzrev.v1', // { 's': 'YYYY-MM-DD' } last revision date per surah
  updateCheck: 'noor.updatecheck.v1', // timestamp of last update check
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
