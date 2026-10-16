// Deen — Islamic Habit Tracker
// Track daily Islamic habits: dhikr, Quran, tahajjud, etc. with streaks.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, useTheme, TopBar, Sub } from '../components/ui';
import { FONTS } from '../lib/theme';
import { AdBanner } from '../components/AdBanner';

interface Habit {
  id: string;
  name: string;
  icon: string;
  desc: string;
  target: number; // daily target
  unit: string;
}

const HABITS: Habit[] = [
  { id: 'fajr', name: 'Fajr on Time', icon: '🌙', desc: 'Pray Fajr at its time', target: 1, unit: '' },
  { id: 'quran', name: 'Quran Reading', icon: '📖', desc: 'Read at least 1 page', target: 1, unit: 'pages' },
  { id: 'dhikr', name: 'Dhikr', icon: '📿', desc: '100x SubhanAllah etc.', target: 100, unit: '' },
  { id: 'tahajjud', name: 'Tahajjud', icon: '🌌', desc: 'Night prayer', target: 1, unit: '' },
  { id: 'duha', name: 'Duha Prayer', icon: '☀️', desc: 'Morning prayer', target: 1, unit: '' },
  { id: 'istighfar', name: 'Istighfar', icon: '🤲', desc: '100x Astaghfirullah', target: 100, unit: '' },
  { id: 'durud', name: 'Durud Sharif', icon: '💚', desc: '100x Durud', target: 100, unit: '' },
  { id: 'sadaqah', name: 'Sadaqah', icon: '💰', desc: 'Give charity', target: 1, unit: '' },
];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HabitTracker() {
  const th = useTheme();
  const today = useMemo(() => new Date(), []);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const key = `habits:${dayKey(today)}`;
      const raw = await AsyncStorage.getItem(key);
      setProgress(raw ? JSON.parse(raw) : {});
      // Load streaks
      const sRaw = await AsyncStorage.getItem('habitStreaks');
      setStreaks(sRaw ? JSON.parse(sRaw) : {});
    } catch {
      setProgress({});
    }
  }, [today]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const increment = useCallback(async (id: string, target: number) => {
    setProgress(prev => {
      const current = prev[id] || 0;
      const next = Math.min(current + 1, target * 3); // cap at 3x target
      const updated = { ...prev, [id]: next };
      AsyncStorage.setItem(`habits:${dayKey(today)}`, JSON.stringify(updated)).catch(() => {});
      // Update streak if target reached
      if (next >= target && current < target) {
        setStreaks(prevS => {
          const ns = { ...prevS, [id]: (prevS[id] || 0) + 1 };
          AsyncStorage.setItem('habitStreaks', JSON.stringify(ns)).catch(() => {});
          return ns;
        });
      }
      return updated;
    });
  }, [today]);

  const reset = useCallback(async (id: string) => {
    setProgress(prev => {
      const updated = { ...prev, [id]: 0 };
      AsyncStorage.setItem(`habits:${dayKey(today)}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, [today]);

  const completedCount = HABITS.filter(h => (progress[h.id] || 0) >= h.target).length;
  const totalHabits = HABITS.length;
  const completionPct = Math.round((completedCount / totalHabits) * 100);

  return (
    <Screen edges={['top']}>
      <TopBar title="Habit Tracker" onBack={() => router.back()} />
      <Scroller>
        {/* Progress overview */}
        <Card>
          <Text style={[styles.title, { color: th.text }]}>📊 Today's Progress</Text>
          <View style={styles.progressHeader}>
            <Text style={[styles.pct, { color: th.primary }]}>{completionPct}%</Text>
            <Text style={[styles.count, { color: th.sub }]}>
              {completedCount}/{totalHabits} habits done
            </Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: th.chip }]}>
            <View style={[styles.progressFill, { backgroundColor: th.primary, width: `${completionPct}%` }]} />
          </View>
        </Card>

        {/* Habits list */}
        {HABITS.map(habit => {
          const current = progress[habit.id] || 0;
          const isDone = current >= habit.target;
          const streak = streaks[habit.id] || 0;
          return (
            <Card key={habit.id} style={isDone ? { borderColor: th.primary, borderWidth: 1.5 } : undefined}>
              <View style={styles.habitRow}>
                <Text style={{ fontSize: 28 }}>{habit.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.habitTitleRow}>
                    <Text style={[styles.habitName, { color: th.text }]}>{habit.name}</Text>
                    {streak > 0 && (
                      <View style={[styles.streakBadge, { backgroundColor: th.accentSoft }]}>
                        <Text style={[styles.streakText, { color: th.accent }]}>🔥 {streak}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.habitDesc, { color: th.sub }]}>{habit.desc}</Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.miniProgressBg, { backgroundColor: th.chip }]}>
                      <View style={[
                        styles.miniProgressFill,
                        { backgroundColor: isDone ? th.primary : th.accent, width: `${Math.min(100, (current / habit.target) * 100)}%` },
                      ]} />
                    </View>
                    <Text style={[styles.progressText, { color: th.sub }]}>
                      {current}/{habit.target}{habit.unit ? ` ${habit.unit}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => increment(habit.id, habit.target)}
                  style={[styles.actionBtn, { backgroundColor: th.primary }]}
                >
                  <Text style={styles.actionBtnText}>+1</Text>
                </TouchableOpacity>
                {current > 0 && (
                  <TouchableOpacity
                    onPress={() => reset(habit.id)}
                    style={[styles.actionBtn, { backgroundColor: th.chip }]}
                  >
                    <Text style={[styles.actionBtnText, { color: th.text }]}>Reset</Text>
                  </TouchableOpacity>
                )}
                {isDone && <Text style={{ fontSize: 20 }}>✅</Text>}
              </View>
            </Card>
          );
        })}

        <Card style={{ backgroundColor: th.accentSoft }}>
          <Text style={{ color: th.text, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
            💪 "The most beloved deeds are the most consistent, even if small."{'\n'}
            <Text style={{ color: th.sub, fontSize: 12 }}>— Sahih Bukhari</Text>
          </Text>
        </Card>

        <AdBanner />
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontFamily: FONTS.bodySemi, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 10 },
  pct: { fontSize: 32, fontFamily: FONTS.bodyBold },
  count: { fontSize: 14 },
  progressBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5 },
  habitRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  habitTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  habitName: { fontSize: 16, fontFamily: FONTS.bodySemi },
  streakBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  streakText: { fontSize: 12, fontWeight: '700' },
  habitDesc: { fontSize: 13, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  miniProgressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, minWidth: 60, textAlign: 'right' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
