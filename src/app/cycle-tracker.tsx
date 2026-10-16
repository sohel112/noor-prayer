// Deen — Cycle Tracker (Menstrual)
// Helps sisters know when prayer/fast is exempt and when ghusl is due.
// Fiqh note: rulings vary by madhhab; consult a scholar for specifics.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

interface CycleEntry {
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
}

const STORE_KEY = 'cycleTracker';

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export default function CycleTracker() {
  const th = useTheme();
  const [cycles, setCycles] = useState<CycleEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) setCycles(JSON.parse(raw));
    });
  }, []);

  const save = async (c: CycleEntry[]) => {
    setCycles(c);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(c));
  };

  const activeCycle = cycles.find(c => c.endDate === null);
  const today = fmtDate(new Date());

  const startPeriod = async () => {
    if (activeCycle) return;
    await save([...cycles, { startDate: today, endDate: null }]);
  };

  const endPeriod = async () => {
    if (!activeCycle) return;
    Alert.alert(
      'Period Ended?',
      'Mark today as the last day? After ghusl, prayer becomes obligatory again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Ended',
          onPress: async () => {
            await save(cycles.map(c =>
              c === activeCycle ? { ...c, endDate: today } : c
            ));
          },
        },
      ]
    );
  };

  // Predictions
  const completed = cycles.filter(c => c.endDate !== null);
  let avgCycle = 28;
  let avgPeriod = 5;
  if (completed.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < completed.length; i++) {
      gaps.push(daysBetween(completed[i - 1].startDate, completed[i].startDate));
    }
    avgCycle = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    const durations = completed.map(c => daysBetween(c.startDate, c.endDate!) + 1);
    avgPeriod = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  let nextPredicted = '';
  let status = '';
  let statusColor = th.text;

  if (activeCycle) {
    const dayNum = daysBetween(activeCycle.startDate, today) + 1;
    status = `Day ${dayNum} — Prayer & fasting exempt. 🤲`;
    statusColor = th.accent;
    if (dayNum > 10) {
      status += '\n⚠️ Beyond 10 days — consult a scholar (may be istihada).';
    }
  } else if (completed.length > 0) {
    const last = completed[completed.length - 1];
    const next = new Date(parseDate(last.startDate).getTime() + avgCycle * 86400000);
    nextPredicted = fmtDate(next);
    const daysUntil = daysBetween(today, nextPredicted);
    if (daysUntil <= 0) {
      status = 'Predicted period may start soon. Be prepared. 🌸';
    } else if (daysUntil <= 3) {
      status = `${daysUntil} day(s) until predicted start.`;
    } else {
      status = `Next predicted: ${nextPredicted} (${daysUntil} days)`;
    }
    statusColor = th.primary;
  } else {
    status = 'Log your first period to start tracking. 🌸';
  }

  return (
    <Screen edges={['top']}>
      <TopBar title="🌸 Cycle Tracker" onBack={() => router.back()} />
      <Scroller>
        {/* Status */}
        <Card style={[styles.statusCard, { backgroundColor: th.accentSoft }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </Card>

        {/* Action */}
        <Card>
          {!activeCycle ? (
            <TouchableOpacity onPress={startPeriod} style={[styles.actionBtn, { backgroundColor: th.primary }]}>
              <Text style={styles.actionText}>🌸 Period Started Today</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={endPeriod} style={[styles.actionBtn, { backgroundColor: th.accent }]}>
              <Text style={styles.actionText}>✨ Period Ended (Ghusl Due)</Text>
            </TouchableOpacity>
          )}
          <Sub style={{ textAlign: 'center', marginTop: 12 }}>
            Average cycle: {avgCycle} days • Average period: {avgPeriod} days
          </Sub>
        </Card>

        {/* Islamic guidance */}
        <SectionTitle>Islamic Guidance</SectionTitle>
        <Card>
          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>🚫</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: th.text }]}>During menstruation</Text>
              <Sub>Salah and fasting are not required. Missed fasts of Ramadan must be made up later; missed prayers are forgiven.</Sub>
            </View>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>🚿</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: th.text }]}>After it ends</Text>
              <Sub>Perform ghusl (full ritual bath), then resume prayer immediately.</Sub>
            </View>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: th.text }]}>Note</Text>
              <Sub>Max hayd is 10 days (Hanafi). Beyond that may be istihada — consult a scholar.</Sub>
            </View>
          </View>
        </Card>

        {/* History */}
        <SectionTitle>History</SectionTitle>
        <Card>
          {cycles.length === 0 ? (
            <Sub style={{ textAlign: 'center', paddingVertical: 12 }}>No records yet.</Sub>
          ) : (
            [...cycles].reverse().slice(0, 12).map((c, i) => (
              <View key={i} style={[styles.histRow, { borderColor: th.border }]}>
                <Text style={{ fontSize: 18 }}>{c.endDate ? '✅' : '🔴'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.histText, { color: th.text }]}>
                    {c.startDate} → {c.endDate || 'ongoing'}
                  </Text>
                  {c.endDate && (
                    <Sub>{daysBetween(c.startDate, c.endDate) + 1} days</Sub>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 12 }}>
            This is a personal tracker. For fiqh rulings specific to your situation, please consult a qualified scholar.
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: { padding: 18, borderRadius: 16, alignItems: 'center' },
  statusText: { fontSize: 16, fontFamily: FONTS.bodySemi, textAlign: 'center', lineHeight: 24 },
  actionBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  guideRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  guideIcon: { fontSize: 24 },
  guideTitle: { fontSize: 15, fontFamily: FONTS.bodySemi, marginBottom: 4 },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, paddingVertical: 10,
  },
  histText: { fontSize: 14, fontFamily: FONTS.bodySemi },
});
