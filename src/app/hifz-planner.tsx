// Deen — Hifz Revision Planner
// Spaced-repetition reminders for memorized surahs: revise after
// 1, 3, 7, 14, then every 30 days. Most overdue first.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, TopBar, useTheme } from '../components/ui';
import { getJSON, setJSON } from '../lib/storage';
import { SURAHS } from '../data/surahs';
import { FONTS } from '../lib/theme';

// Spaced-repetition intervals (days) after each completed revision.
const INTERVALS = [1, 3, 7, 14, 30];

function dayKeyStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  // Whole days from a to b (b - a), using local midnight dates.
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const da = new Date(pa[0], pa[1] - 1, pa[2]);
  const db = new Date(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

interface SurahPlan {
  surah: number;
  ayahCount: number;
  lastRev: string | null;
  revisions: number;
  intervalDays: number;
  dueInDays: number; // <= 0 means due/overdue
}

export default function HifzPlanner() {
  const th = useTheme();
  const [plans, setPlans] = useState<SurahPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    // Memorized ayahs: { 's:a': 'memorized' }
    const hifz = await getJSON<Record<string, string>>('hifz', {});
    const bySurah = new Map<number, number>();
    for (const [k, v] of Object.entries(hifz ?? {})) {
      if (v !== 'memorized') continue;
      const s = parseInt(String(k).split(':')[0], 10);
      if (s >= 1 && s <= 114) bySurah.set(s, (bySurah.get(s) ?? 0) + 1);
    }
    // Revision history: { 's': 'YYYY-MM-DD' } (tolerates { date, n } shape)
    const rev = await getJSON<Record<string, string | { date?: string; n?: number }>>('hifzRev', {});
    const today = dayKeyStr(new Date());

    const list: SurahPlan[] = [];
    for (const [s, ayahCount] of bySurah) {
      const raw = rev?.[String(s)];
      let lastRev: string | null = null;
      let revisions = 0;
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        lastRev = raw;
        revisions = 1;
      } else if (raw && typeof raw === 'object') {
        if (typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) lastRev = raw.date;
        revisions = typeof raw.n === 'number' && raw.n > 0 ? Math.floor(raw.n) : (lastRev ? 1 : 0);
      }
      const intervalDays = INTERVALS[Math.min(revisions, INTERVALS.length - 1)];
      // Never revised -> due right now (most overdue).
      const dueInDays = lastRev ? intervalDays - daysBetween(lastRev, today) : 0;
      list.push({ surah: s, ayahCount, lastRev, revisions, intervalDays, dueInDays });
    }
    // Most overdue first, then soonest due.
    list.sort((a, b) => a.dueInDays - b.dueInDays);
    setPlans(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const markRevised = useCallback(async (surah: number) => {
    const today = dayKeyStr(new Date());
    const rev = await getJSON<Record<string, string | { date?: string; n?: number }>>('hifzRev', {});
    const raw = rev?.[String(surah)];
    let n = 1;
    if (typeof raw === 'object' && raw && typeof raw.n === 'number') n = Math.floor(raw.n) + 1;
    else if (typeof raw === 'string') n = 2;
    await setJSON('hifzRev', { ...(rev ?? {}), [String(surah)]: { date: today, n } });
    await load();
  }, [load]);

  const dueCount = useMemo(() => plans.filter(p => p.dueInDays <= 0).length, [plans]);

  return (
    <Screen edges={['top']}>
      <TopBar title="Hifz Revision Planner" onBack={() => router.back()} />
      <Scroller>
        <Title>🧠 Revision Planner</Title>
        <Sub>
          Spaced repetition: revise after 1, 3, 7, 14, then every 30 days.
          {dueCount > 0 ? ` ${dueCount} due now.` : ' All caught up! 🎉'}
        </Sub>

        {!loaded ? null : plans.length === 0 ? (
          <Card style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📖</Text>
            <Sub style={{ marginTop: 8, textAlign: 'center' }}>
              No memorized surahs yet. Mark ayahs as memorized in Hifz mode to build your plan.
            </Sub>
          </Card>
        ) : (
          plans.map(p => {
            const meta = SURAHS[p.surah - 1];
            const overdue = p.dueInDays < 0;
            const dueNow = p.dueInDays === 0;
            const statusColor = overdue || dueNow ? '#C0392B' : th.sub;
            const statusText = p.lastRev === null
              ? 'Due now — first revision'
              : overdue
                ? `Overdue by ${-p.dueInDays} ${-p.dueInDays === 1 ? 'day' : 'days'}`
                : dueNow
                  ? 'Due today'
                  : `Due in ${p.dueInDays} ${p.dueInDays === 1 ? 'day' : 'days'}`;
            return (
              <Card key={p.surah} style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.emblem, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
                    <Text style={[styles.emblemText, { color: th.primary }]}>{p.surah}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.surahName, { color: th.text }]}>
                      Surah {meta.en}
                    </Text>
                    <Text style={[styles.surahSub, { color: th.sub }]}>
                      {p.ayahCount} memorized • every {p.intervalDays}d
                    </Text>
                    <Text style={[styles.status, { color: statusColor }]}>
                      {statusText}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => markRevised(p.surah)}
                  activeOpacity={0.8}
                  style={[styles.reviseBtn, { backgroundColor: th.primary }]}
                >
                  <Text style={styles.reviseText}>✓ Mark Revised</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 36 },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emblem: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  emblemText: { fontWeight: '800', fontSize: 16, fontFamily: FONTS.bodyBold },
  surahName: { fontSize: 16, fontWeight: '700', fontFamily: FONTS.bodySemi },
  surahSub: { fontSize: 13, marginTop: 3, fontFamily: FONTS.body },
  status: { fontSize: 13, marginTop: 4, fontFamily: FONTS.bodySemi },
  reviseBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  reviseText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bodySemi },
});
