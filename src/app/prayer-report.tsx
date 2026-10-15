// Deen — Monthly Prayer Report
// This month's prayer stats: totals, per-prayer breakdown, best streak.

import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, TopBar, useTheme } from '../components/ui';
import { getJSON } from '../lib/storage';
import { FONTS } from '../lib/theme';

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type PrayerName = (typeof PRAYER_ORDER)[number];

const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌌',
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type DayLog = Partial<Record<PrayerName, boolean>>;

/** Merge the two on-device log shapes into one map for the month. */
async function loadMonthLogs(year: number, month: number): Promise<Record<string, DayLog>> {
  const merged: Record<string, DayLog> = {};

  // Shape 1: aggregated prayerlog map.
  try {
    const agg = await getJSON<Record<string, DayLog>>('prayerLog', {});
    for (const [k, v] of Object.entries(agg ?? {})) {
      if (k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) merged[k] = v;
    }
  } catch { /* ignore */ }

  // Shape 2: per-day keys written by the tracker: prayerDone:YYYY-MM-DD -> string[]
  try {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const keys: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      keys.push(`prayerDone:${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) {
      if (!v) continue;
      const dk = k.replace('prayerDone:', '');
      const arr = JSON.parse(v) as string[];
      const log: DayLog = {};
      for (const p of PRAYER_ORDER) log[p] = arr.includes(p);
      merged[dk] = { ...(merged[dk] ?? {}), ...log };
    }
  } catch { /* ignore */ }

  return merged;
}

export default function PrayerReport() {
  const th = useTheme();
  const [logs, setLogs] = useState<Record<string, DayLog>>({});

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysElapsed = now.getDate();

  useEffect(() => {
    queueMicrotask(() => {
      loadMonthLogs(year, month).then(setLogs).catch(() => setLogs({}));
    });
  }, [year, month]);

  const stats = useMemo(() => {
    const perPrayer: Record<PrayerName, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    let total = 0;
    let fullDays = 0;
    // Best streak: longest run of consecutive all-5 days this month.
    let best = 0;
    let run = 0;
    for (let d = 1; d <= daysElapsed; d++) {
      const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const log = logs[k] ?? {};
      let dayCount = 0;
      for (const p of PRAYER_ORDER) {
        if (log[p]) { perPrayer[p]++; dayCount++; }
      }
      total += dayCount;
      if (dayCount >= 5) { fullDays++; run++; best = Math.max(best, run); }
      else run = 0;
    }
    const possible = daysElapsed * 5;
    return { perPrayer, total, possible, fullDays, best, pct: possible > 0 ? Math.round((total / possible) * 100) : 0 };
  }, [logs, year, month, daysElapsed]);

  const monthName = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <Screen edges={['top']}>
      <TopBar title="Monthly Report" onBack={() => router.back()} />
      <Scroller>
        <Title>📊 {monthName}</Title>
        <Sub>Your prayer summary for this month</Sub>

        {/* Summary */}
        <Card style={[styles.hero, { backgroundColor: th.primary }]}>
          <Text style={styles.heroPct}>{stats.pct}%</Text>
          <Text style={styles.heroSub}>
            {stats.total} of {stats.possible} prayers offered
          </Text>
          <Text style={styles.heroSub}>{stats.fullDays} perfect days this month</Text>
        </Card>

        {/* Per-prayer breakdown */}
        <Card>
          <Text style={[styles.cardTitle, { color: th.text }]}>Per-prayer breakdown</Text>
          {PRAYER_ORDER.map(p => {
            const done = stats.perPrayer[p];
            const pct = daysElapsed > 0 ? Math.round((done / daysElapsed) * 100) : 0;
            const label = p[0].toUpperCase() + p.slice(1);
            return (
              <View key={p} style={styles.barRow}>
                <Text style={{ fontSize: 18, width: 28 }}>{PRAYER_ICONS[p]}</Text>
                <Text style={[styles.barLabel, { color: th.text }]}>{label}</Text>
                <View style={[styles.barTrack, { backgroundColor: th.chip }]}>
                  <View style={[styles.barFill, { backgroundColor: th.primary, width: `${pct}%` }]} />
                </View>
                <Text style={[styles.barCount, { color: th.sub, fontVariant: ['tabular-nums'] }]}>
                  {done}/{daysElapsed}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Best streak */}
        <Card style={[styles.streakCard, { backgroundColor: th.accentSoft }]}>
          <Text style={{ fontSize: 30 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: th.text, marginBottom: 2 }]}>
              Best streak: {stats.best} {stats.best === 1 ? 'day' : 'days'}
            </Text>
            <Sub>Longest run of perfect 5-prayer days this month</Sub>
          </View>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 4 },
  heroPct: { color: '#FFFFFF', fontSize: 52, fontFamily: FONTS.bodyBold, fontVariant: ['tabular-nums'] },
  heroSub: { color: '#FFFFFF', fontSize: 14, fontFamily: FONTS.bodyMedium, marginTop: 4, opacity: 0.9 },
  cardTitle: { fontSize: 17, fontFamily: FONTS.bodySemi, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  barLabel: { fontSize: 14, fontFamily: FONTS.bodyMedium, width: 62 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barCount: { fontSize: 13, fontFamily: FONTS.bodyMedium, width: 52, textAlign: 'right' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 18 },
});
