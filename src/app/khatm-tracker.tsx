// Deen — Khatm Tracker
// Quran completion tracker: 30/60/90 day plans, daily juz progress (1-30).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'khatmTracker';

interface KhatmState {
  planDays: number; // 30 | 60 | 90
  startDate: string; // YYYY-MM-DD
  completedJuz: number[]; // list of juz numbers completed (1-30)
}

const PLANS = [
  { days: 30, label: '30 Days', desc: '1 juz per day — intense & focused', icon: '🔥' },
  { days: 60, label: '60 Days', desc: '½ juz per day — steady pace', icon: '📖' },
  { days: 90, label: '90 Days', desc: '⅓ juz per day — relaxed pace', icon: '🌱' },
];

const TOTAL_JUZ = 30;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.floor((db.getTime() - da.getTime()) / 86400000);
}

export default function KhatmTracker() {
  const th = useTheme();
  const [state, setState] = useState<KhatmState | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      setState(raw ? JSON.parse(raw) : null);
    } catch {
      setState(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const save = useCallback(async (s: KhatmState | null) => {
    setState(s);
    if (s) {
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(s));
    } else {
      await AsyncStorage.removeItem(STORE_KEY);
    }
  }, []);

  const startPlan = useCallback((planDays: number) => {
    save({ planDays, startDate: todayStr(), completedJuz: [] });
  }, [save]);

  const toggleJuz = useCallback((juz: number) => {
    if (!state) return;
    const done = state.completedJuz.includes(juz);
    const completedJuz = done
      ? state.completedJuz.filter(j => j !== juz)
      : [...state.completedJuz, juz].sort((a, b) => a - b);
    save({ ...state, completedJuz });
  }, [state, save]);

  const progress = useMemo(() => {
    if (!state) return { done: 0, pct: 0, dayNum: 0, remaining: 0, onTrack: true };
    const done = state.completedJuz.length;
    const pct = Math.round((done / TOTAL_JUZ) * 100);
    const dayNum = Math.max(1, daysBetween(state.startDate, todayStr()) + 1);
    const remaining = state.planDays - dayNum + 1;
    const expected = Math.min(TOTAL_JUZ, Math.floor((dayNum / state.planDays) * TOTAL_JUZ));
    return { done, pct, dayNum, remaining, onTrack: done >= expected };
  }, [state]);

  if (!loaded) {
    return (
      <Screen edges={['top']}>
        <TopBar title="📖 Khatm Tracker" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <TopBar title="📖 Khatm Tracker" onBack={() => router.back()} />
      <Scroller>
        {!state ? (
          <>
            <SectionTitle>Choose Your Plan</SectionTitle>
            {PLANS.map(p => (
              <TouchableOpacity key={p.days} onPress={() => startPlan(p.days)}>
                <Card style={[styles.planCard, { borderColor: th.border }]}>
                  <Text style={styles.planIcon}>{p.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planLabel, { color: th.text }]}>{p.label}</Text>
                    <Sub>{p.desc}</Sub>
                  </View>
                  <Text style={[styles.planArrow, { color: th.primary }]}>→</Text>
                </Card>
              </TouchableOpacity>
            ))}
            <Card style={{ marginTop: 8 }}>
              <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
                "The best of you are those who learn the Quran and teach it." — Sahih al-Bukhari
              </Sub>
            </Card>
          </>
        ) : (
          <>
            {/* Progress header */}
            <Card style={[styles.heroCard, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
              <View style={styles.heroRow}>
                <Text style={[styles.heroPct, { color: th.primary }]}>{progress.pct}%</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroTitle, { color: th.text }]}>
                    {progress.done} / {TOTAL_JUZ} Juz Complete
                  </Text>
                  <Sub>
                    Day {progress.dayNum} of {state.planDays}
                    {progress.remaining > 0 ? ` • ${progress.remaining} days left` : ' • Plan complete!'}
                  </Sub>
                </View>
              </View>
              <View style={[styles.barTrack, { backgroundColor: th.border }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${progress.pct}%`, backgroundColor: th.primary },
                  ]}
                />
              </View>
              <Sub style={{ marginTop: 8 }}>
                {progress.onTrack
                  ? '✅ You are on track, mashAllah!'
                  : '⚠️ Slightly behind pace — catch up with an extra juz!'}
              </Sub>
            </Card>

            <SectionTitle>Tap to Mark Juz Complete</SectionTitle>
            <Card>
              <View style={styles.grid}>
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map(juz => {
                  const done = state.completedJuz.includes(juz);
                  return (
                    <TouchableOpacity
                      key={juz}
                      onPress={() => toggleJuz(juz)}
                      style={[
                        styles.juzCell,
                        {
                          backgroundColor: done ? th.primary : th.bg,
                          borderColor: done ? th.primary : th.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.juzNum,
                          { color: done ? '#FFF' : th.text },
                        ]}
                      >
                        {juz}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <TouchableOpacity
              onPress={() => save(null)}
              style={[styles.resetBtn, { borderColor: th.border }]}
            >
              <Text style={[styles.resetText, { color: th.sub }]}>↺ Restart with a new plan</Text>
            </TouchableOpacity>

            <Card style={{ marginTop: 8 }}>
              <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
                "Whoever recites a letter of the Quran gets ten rewards." — Jami' at-Tirmidhi
              </Sub>
            </Card>
          </>
        )}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, marginBottom: 10, padding: 16,
  },
  planIcon: { fontSize: 30 },
  planLabel: { fontSize: 17, fontFamily: FONTS.bodyBold },
  planArrow: { fontSize: 22, fontFamily: FONTS.bodyBold },
  heroCard: { borderWidth: 1, padding: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  heroPct: { fontSize: 34, fontFamily: FONTS.bodyBold },
  heroTitle: { fontSize: 16, fontFamily: FONTS.bodySemi },
  barTrack: { height: 10, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  juzCell: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  juzNum: { fontSize: 16, fontFamily: FONTS.bodyBold },
  resetBtn: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    alignItems: 'center', marginTop: 12,
  },
  resetText: { fontSize: 14, fontFamily: FONTS.bodySemi },
});
