// Deen — Voluntary Fasting Tracker
// Monday/Thursday, Ayyam al-Bid (13/14/15), Arafah, Ashura, 6 Shawwal

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

interface FastEntry {
  date: string; // YYYY-MM-DD
  type: string; // 'monday' | 'thursday' | 'ayyam-bid' | 'arafah' | 'ashura' | 'shawwal' | 'other'
}

const FAST_TYPES: { key: string; label: string; desc: string; icon: string }[] = [
  { key: 'monday', label: 'Monday Fast', desc: 'Sunnah — Prophet ﷺ fasted Mondays', icon: '🌙' },
  { key: 'thursday', label: 'Thursday Fast', desc: 'Sunnah — deeds presented to Allah', icon: '🌙' },
  { key: 'ayyam-bid', label: "Ayyam al-Bid", desc: '13th, 14th, 15th of Islamic month', icon: '🌕' },
  { key: 'arafah', label: 'Day of Arafah', desc: '9th Dhul Hijjah — expiates 2 years', icon: '🕋' },
  { key: 'ashura', label: 'Ashura', desc: '10th Muharram (+9th or 11th)', icon: '📿' },
  { key: 'shawwal', label: '6 Days of Shawwal', desc: 'After Ramadan — like fasting a year', icon: '✨' },
  { key: 'other', label: 'Other Voluntary Fast', desc: 'Any nafl fast', icon: '🤲' },
];

const STORE_KEY = 'voluntaryFasts';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FastingTracker() {
  const th = useTheme();
  const [fasts, setFasts] = useState<FastEntry[]>([]);
  const [selectedType, setSelectedType] = useState('monday');

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) setFasts(JSON.parse(raw));
    });
  }, []);

  const save = async (newFasts: FastEntry[]) => {
    setFasts(newFasts);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(newFasts));
  };

  const logFast = async () => {
    const today = todayStr();
    if (fasts.some(f => f.date === today)) return; // already logged today
    await save([...fasts, { date: today, type: selectedType }]);
  };

  const removeFast = async (date: string) => {
    await save(fasts.filter(f => f.date !== date));
  };

  const todayLogged = fasts.some(f => f.date === todayStr());
  const totalFasts = fasts.length;
  const thisMonth = fasts.filter(f => f.date.startsWith(todayStr().slice(0, 7))).length;

  return (
    <Screen edges={['top']}>
      <TopBar title="🌙 Voluntary Fasts" onBack={() => router.back()} />
      <Scroller>
        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{totalFasts}</Text>
              <Sub>Total Fasts</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{thisMonth}</Text>
              <Sub>This Month</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>
                {todayLogged ? '✅' : '○'}
              </Text>
              <Sub>Today</Sub>
            </View>
          </View>
        </Card>

        {/* Log today */}
        <SectionTitle>Log Today's Fast</SectionTitle>
        <Card>
          {FAST_TYPES.map(ft => (
            <TouchableOpacity
              key={ft.key}
              onPress={() => setSelectedType(ft.key)}
              style={[
                styles.typeRow,
                { borderColor: th.border },
                selectedType === ft.key && { backgroundColor: th.accentSoft, borderColor: th.accent },
              ]}
            >
              <Text style={styles.typeIcon}>{ft.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeLabel, { color: th.text }]}>{ft.label}</Text>
                <Sub>{ft.desc}</Sub>
              </View>
              {selectedType === ft.key && <Text style={{ color: th.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={logFast}
            disabled={todayLogged}
            style={[
              styles.logBtn,
              { backgroundColor: th.primary, opacity: todayLogged ? 0.4 : 1 },
            ]}
          >
            <Text style={styles.logBtnText}>
              {todayLogged ? '✅ Already Logged Today' : '🌙 Log Fast for Today'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* History */}
        <SectionTitle>History</SectionTitle>
        <Card>
          {fasts.length === 0 ? (
            <Sub style={{ textAlign: 'center', paddingVertical: 16 }}>
              No fasts logged yet. Start with Monday or Thursday! 🌙
            </Sub>
          ) : (
            [...fasts].reverse().slice(0, 30).map(f => {
              const ft = FAST_TYPES.find(t => t.key === f.type);
              return (
                <View key={f.date} style={[styles.histRow, { borderColor: th.border }]}>
                  <Text style={styles.typeIcon}>{ft?.icon || '🌙'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeLabel, { color: th.text }]}>
                      {ft?.label || f.type}
                    </Text>
                    <Sub>{f.date}</Sub>
                  </View>
                  <TouchableOpacity onPress={() => removeFast(f.date)}>
                    <Text style={{ color: th.sub, fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </Card>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "The best fasting after Ramadan is the month of Allah, Muharram." — Sahih Muslim
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
  statNum: { fontSize: 28, fontFamily: FONTS.bodyBold },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 15, fontFamily: FONTS.bodySemi },
  logBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  logBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, paddingVertical: 10,
  },
});
