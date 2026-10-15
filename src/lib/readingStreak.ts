// Quran reading streak — consecutive days the user opened a surah.

import { getJSON, setJSON } from './storage';

export function dayKeyStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Record today as a reading day. Keeps the last 365 entries. */
export async function recordReadingDay(): Promise<void> {
  try {
    const data = await getJSON<{ dates: string[] }>('readingStreak', { dates: [] });
    const dates = Array.isArray(data.dates) ? data.dates : [];
    const today = dayKeyStr(new Date());
    if (!dates.includes(today)) {
      const next = [...dates, today].sort().slice(-365);
      await setJSON('readingStreak', { dates: next });
    }
  } catch {
    // storage unavailable — streak tracking is best-effort
  }
}

/** Load stored reading dates. */
export async function loadReadingDates(): Promise<string[]> {
  const data = await getJSON<{ dates: string[] }>('readingStreak', { dates: [] });
  return Array.isArray(data.dates) ? data.dates : [];
}

/**
 * Consecutive-day streak ending today (or yesterday if the user hasn't
 * read yet today). Returns 0 when there is no recent reading.
 */
export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const d = new Date();
  // If today isn't logged yet, a streak ending yesterday still counts.
  if (!set.has(dayKeyStr(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(dayKeyStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
