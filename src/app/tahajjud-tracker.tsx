// Deen — Tahajjud Tracker
// Night prayer daily check-in with streak counter and weekly view.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'tahajjudLog'; // string[] of YYYY-MM-DD

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDay(key: string, delta: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

const RAKAH_OPTIONS = [2, 4, 6, 8, 12];

export default function TahajjudTracker() {
  const th = useTheme();
  const today = useMemo(() => dayKey(new Date()), []);
  const [log, setLog] = useState<string[]>([]);
  const [rakahs, setRakahs] = useState<Record<string, number>>({});
  const [selectedRakahs, setSelectedRakahs] = useState(8);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Support both old (string[]) and new ({dates, rakahs}) formats
        if (Array.isArray(parsed)) {
          setLog(parsed);
        } else {
          setLog(parsed.dates ?? []);
          setRakahs(parsed.rakahs ?? {});
        }
      }
    } catch {
      setLog([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const save = useCallback(async (dates: string[], rk: Record<string, number>) => {
    setLog(dates);
    setRakahs(rk);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ dates, rakahs: rk }));
  }, []);

  const toggleToday = useCallback(() => {
    const done = log.includes(today);
    if (done) {
      const dates = log.filter(d => d !== today);
      const rk = { ...rakahs };
      delete rk[today];
      save(dates, rk);
    } else {
      save([...log, today], { ...rakahs, [today]: selectedRakahs });
    }
  }, [log, today, rakahs, selectedRakahs, save]);

  const streak = useMemo(() => {
    let s = 0;
    // Count back from today (or yesterday if today not done yet)
    let cursor = log.includes(today) ? today : shiftDay(today, -1);
    while (log.includes(cursor)) {
      s += 1;
      cursor = shiftDay(cursor, -1);
    }
    return s;
  }, [log, today]);

  const week = useMemo(() => {
    // Last 7 days ending today
    return Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  }, [today]);

  const totalNights = log.length;
  const thisMonth = log.filter(d => d.startsWith(today.slice(0, 7))).length;
  const todayDone = log.includes(today);

  const dayLabel = (key: string) =>
    new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });

  return (
    <Screen edges={['top']}>
      <TopBar title="🌌 Tahajjud Tracker" onBack={() => router.back()} />
      <Scroller>
        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{streak}🔥</Text>
              <Sub>Day Streak</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{totalNights}</Text>
              <Sub>Total Nights</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{thisMonth}</Text>
              <Sub>This Month</Sub>
            </View>
          </View>
        </Card>

        {/* Weekly view */}
        <SectionTitle>This Week</SectionTitle>
        <Card>
          <View style={styles.weekRow}>
            {week.map(key => {
              const done = log.includes(key);
              const isToday = key === today;
              return (
                <View key={key} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: done ? th.primary : 'transparent',
                        borderColor: isToday ? th.accent : th.border,
                        borderWidth: isToday ? 2.5 : 1.5,
                      },
                    ]}
                  >
                    {done && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Sub style={{ fontSize: 11 }}>{dayLabel(key)}</Sub>
                  <Sub style={{ fontSize: 10 }}>{key.slice(8)}</Sub>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Check-in */}
        <SectionTitle>Tonight's Tahajjud</SectionTitle>
        <Card>
          <Sub style={{ marginBottom: 10 }}>How many rak'ahs do you plan to pray?</Sub>
          <View style={styles.rakahRow}>
            {RAKAH_OPTIONS.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setSelectedRakahs(r)}
                style={[
                  styles.rakahChip,
                  {
                    borderColor: th.border,
                    backgroundColor: selectedRakahs === r ? th.accentSoft : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rakahText,
                    { color: selectedRakahs === r ? th.primary : th.text },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={toggleToday}
            style={[
              styles.checkBtn,
              { backgroundColor: todayDone ? th.accentSoft : th.primary },
            ]}
          >
            <Text
              style={[
                styles.checkBtnText,
                { color: todayDone ? th.primary : '#FFF' },
              ]}
            >
              {todayDone
                ? `✅ Tahajjud Done (${rakahs[today] ?? selectedRakahs} rak'ahs)`
                : `🌌 Mark Tonight's Tahajjud (${selectedRakahs} rak'ahs)`}
            </Text>
          </TouchableOpacity>
          <Sub style={{ textAlign: 'center', marginTop: 8 }}>
            Best time: last third of the night before Fajr
          </Sub>
        </Card>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "The closest the Lord is to His servant is in the last part of the night." — Jami' at-Tirmidhi
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsCard: { paddingVertical: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 26, fontFamily: FONTS.bodyBold },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  dayCol: { alignItems: 'center', gap: 2 },
  dayDot: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#FFF', fontSize: 18, fontFamily: FONTS.bodyBold },
  rakahRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  rakahChip: {
    flex: 1, borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  rakahText: { fontSize: 16, fontFamily: FONTS.bodyBold },
  checkBtn: { borderRadius: 12, padding: 15, alignItems: 'center' },
  checkBtnText: { fontSize: 15, fontFamily: FONTS.bodyBold },
});
