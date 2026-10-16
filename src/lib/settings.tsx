// Global settings — theme, language, prayer method, notifications.
// Persisted locally; loads before first render.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getJSON, setJSON } from './storage';
import { applyRTL } from './i18n';
import type { AsrJuristic, HighLatitudeRule } from './prayerTimes';

export type Lang =
  | 'en' | 'ur' | 'hi' | 'ar' | 'tr' | 'fr' | 'id' | 'bn' | 'fa' | 'ms'
  | 'es' | 'ru' | 'pt' | 'de' | 'it' | 'nl' | 'zh' | 'ja' | 'ko' | 'th'
  | 'vi' | 'sw' | 'ha' | 'uz' | 'kk' | 'az' | 'ku' | 'so';
export type ThemeMode = 'light' | 'dark';

export interface Settings {
  lang: Lang;
  theme: ThemeMode;
  use24h: boolean;
  methodId: string;
  asrJuristic: AsrJuristic;
  highLatitudeRule: HighLatitudeRule;
  dhuhrOffsetMinutes: number;
  adjustments: Record<string, number>;
  hijriAdjust: number; // manual moon-sighting ±days
  azanSound: string; // 'azan1' | 'azan2' | 'silent'
  notifications: Record<string, boolean>; // per-prayer on/off
  fajrForceWake: boolean; // loud force-wake alarm for Fajr (overrides silent via audio mode)
  preAdhanMinutes: number; // 0 = off, 5/10/15 = reminder before each prayer
  quietFrom: string; // "HH:MM"
  quietTo: string;
  translation: Lang; // Quran translation language
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  theme: 'light',
  use24h: false,
  methodId: 'karachi',
  asrJuristic: 'hanafi',
  highLatitudeRule: 'angle',
  dhuhrOffsetMinutes: 0,
  adjustments: {},
  hijriAdjust: 0,
  azanSound: 'azan1',
  notifications: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  fajrForceWake: false,
  preAdhanMinutes: 0,
  quietFrom: '22:00',
  quietTo: '04:00',
  translation: 'en',
};

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void }>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getJSON<Settings>('settings', DEFAULT_SETTINGS).then(s => {
      const merged = { ...DEFAULT_SETTINGS, ...s };
      applyRTL(merged.lang);
      setSettings(merged);
    });
  }, []);

  const update = (p: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...p };
      if (p.lang && p.lang !== prev.lang) {
        applyRTL(p.lang);
        // Auto-sync Quran translation with app language when a translation
        // exists for it (en/hi/ur). User can still change it manually after.
        if (['en', 'hi', 'ur'].includes(p.lang)) {
          next.translation = p.lang as Settings['translation'];
        }
      }
      setJSON('settings', next);
      // Prayer-relevant settings changed → refresh home-screen widget.
      if (p.methodId || p.asrJuristic || p.highLatitudeRule || p.adjustments !== undefined || p.dhuhrOffsetMinutes !== undefined || p.use24h !== undefined || p.hijriAdjust !== undefined) {
        import('./widgetSync').then(m => m.syncPrayerWidget(true)).catch(() => {});
      }
      return next;
    });
  };

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}
