// Widget-ready data provider — computes the "next prayer" snapshot a
// home-screen widget would display, and persists it where a native widget
// (current or future) can read it.
//
// Why this exists: expo-widgets@57 on Android is a stub (the Glance widget
// only renders the widget's name, not real content), so a real Android
// home-screen widget is not feasible in the Expo managed workflow yet.
// This module keeps the app "widget-ready":
//   1. The snapshot is always fresh JSON any future native widget can read.
//   2. It lives in AsyncStorage under WIDGET_SNAPSHOT_KEY — on Android that
//      is the RKStorage SharedPreferences file, readable from native code
//      in the same app sandbox.
// Wiring: call refreshWidgetData() whenever prayer-relevant state changes
// (app foreground, location/method change, notification scheduling).
// See WIDGETS.md for the full picture.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJSON } from './storage';
import { calculatePrayerTimes, nextPrayer, formatTime } from './prayerTimes';
import { toHijri, formatHijri } from './hijri';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import type { SavedLocation } from './location';

/** AsyncStorage key holding the latest widget snapshot JSON. */
export const WIDGET_SNAPSHOT_KEY = 'noor.widget.v1';

export interface WidgetSnapshot {
  /** e.g. "maghrib" */
  nextPrayerName: string;
  /** ISO timestamp of the next prayer */
  nextPrayerAt: string;
  /** "02:34:15" */
  countdownText: string;
  /** today's times, formatted per user 12/24h setting */
  timesToday: Record<string, string>;
  /** e.g. "14 Ramadan 1447H" */
  hijriDate: string;
  locationLabel: string;
  /** ISO timestamp of when the snapshot was built */
  updatedAt: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Build the snapshot from on-device location + settings. Null when no location yet. */
export async function buildWidgetSnapshot(now = new Date()): Promise<WidgetSnapshot | null> {
  const loc = await getJSON<SavedLocation | null>('location', null);
  if (!loc) return null;
  const s = await getJSON<Settings>('settings', DEFAULT_SETTINGS);

  const times = calculatePrayerTimes(now, loc.lat, loc.lng, {
    methodId: s.methodId,
    asrJuristic: s.asrJuristic,
    highLatitudeRule: s.highLatitudeRule,
    adjustments: s.adjustments,
    dhuhrOffsetMinutes: s.dhuhrOffsetMinutes,
  });

  const next = nextPrayer(times, now);
  const ms = Math.max(0, next.at.getTime() - now.getTime());
  const sec = Math.floor(ms / 1000);
  const countdownText = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;

  const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const timesToday: Record<string, string> = {};
  for (const k of order) timesToday[k] = formatTime(times[k], s.use24h);

  return {
    nextPrayerName: next.name,
    nextPrayerAt: next.at.toISOString(),
    countdownText,
    timesToday,
    hijriDate: formatHijri(toHijri(now, s.hijriAdjust), s.lang),
    locationLabel: loc.label,
    updatedAt: now.toISOString(),
  };
}

/**
 * Rebuild the snapshot and persist it for widget consumers.
 * Returns the snapshot, or null when there is no location yet.
 */
export async function refreshWidgetData(now = new Date()): Promise<WidgetSnapshot | null> {
  const snap = await buildWidgetSnapshot(now);
  if (snap) {
    try {
      await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snap));
    } catch {
      // storage unavailable — next refresh will retry
    }
  }
  return snap;
}

/** Read the last persisted snapshot (what a widget would render). */
export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : null;
  } catch {
    return null;
  }
}
