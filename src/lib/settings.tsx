// Global settings — theme, language, prayer method, notifications.
// Persisted locally; loads before first render.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getJSON, setJSON } from './storage';
import type { AsrJuristic, HighLatitudeRule } from './prayerTimes';

export type Lang = 'en' | 'ur' | 'hi';
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
  quietFrom: string; // "HH:MM"
  quietTo: string;
  translation: Lang; // Quran translation language
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  theme: 'dark',
  use24h: false,
  methodId: 'karachi',
  asrJuristic: 'hanafi',
  highLatitudeRule: 'angle',
  dhuhrOffsetMinutes: 0,
  adjustments: {},
  hijriAdjust: 0,
  azanSound: 'azan1',
  notifications: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
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
    getJSON<Settings>('settings', DEFAULT_SETTINGS).then(s =>
      setSettings({ ...DEFAULT_SETTINGS, ...s }),
    );
  }, []);

  const update = (p: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...p };
      setJSON('settings', next);
      return next;
    });
  };

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}
