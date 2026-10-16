// Deen — Masjid Visits Tracker
// Log masjid visits with name & date. Totals + history, local storage.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'masjidVisits';

interface Visit {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  prayer: string; // which prayer, optional
}

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MasjidVisits() {
  const th = useTheme();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [name, setName] = useState('');
  const [prayer, setPrayer] = useState('Fajr');

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) setVisits(JSON.parse(raw));
    });
  }, []);

  const save = async (list: Visit[]) => {
    setVisits(list);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(list));
  };

  const addVisit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter the masjid name.');
      return;
    }
    const entry: Visit = {
      id: `${Date.now()}`,
      name: name.trim(),
      date: todayStr(),
      prayer,
    };
    await save([entry, ...visits]);
    setName('');
  };

  const removeVisit = async (id: string) => {
    await save(visits.filter(v => v.id !== id));
  };

  const { total, monthTotal, uniqueMasjids } = useMemo(() => {
    const total = visits.length;
    const monthPrefix = todayStr().slice(0, 7);
    const monthTotal = visits.filter(v => v.date.startsWith(monthPrefix)).length;
    const uniqueMasjids = new Set(visits.map(v => v.name.toLowerCase())).size;
    return { total, monthTotal, uniqueMasjids };
  }, [visits]);

  return (
    <Screen edges={['top']}>
      <TopBar title="🕌 Masjid Visits" onBack={() => router.back()} />
      <Scroller>
        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{total}</Text>
              <Sub>Total Visits</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{uniqueMasjids}</Text>
              <Sub>Masjids</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{monthTotal}</Text>
              <Sub>This Month</Sub>
            </View>
          </View>
        </Card>

        {/* Log visit */}
        <SectionTitle>Log a Visit</SectionTitle>
        <Card>
          <Text style={[styles.label, { color: th.text }]}>Masjid Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Masjid Al-Noor"
            placeholderTextColor={th.sub}
            style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
          />
          <Text style={[styles.label, { color: th.text }]}>Prayer</Text>
          <View style={styles.prayerRow}>
            {PRAYERS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPrayer(p)}
                style={[
                  styles.prayerChip,
                  {
                    borderColor: th.border,
                    backgroundColor: prayer === p ? th.accentSoft : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.prayerText,
                    { color: prayer === p ? th.primary : th.text },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={addVisit}
            style={[styles.addBtn, { backgroundColor: th.primary }]}
          >
            <Text style={styles.addBtnText}>🕌 Log Visit</Text>
          </TouchableOpacity>
        </Card>

        {/* History */}
        <SectionTitle>History</SectionTitle>
        <Card>
          {visits.length === 0 ? (
            <Sub style={{ textAlign: 'center', paddingVertical: 16 }}>
              No visits logged yet. The masjid is waiting for you! 🕌
            </Sub>
          ) : (
            visits.map(v => (
              <View key={v.id} style={[styles.row, { borderColor: th.border }]}>
                <Text style={styles.rowIcon}>🕌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: th.text }]}>{v.name}</Text>
                  <Sub>{v.date} • {v.prayer}</Sub>
                </View>
                <TouchableOpacity onPress={() => removeVisit(v.id)}>
                  <Text style={{ color: th.sub, fontSize: 20 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "Whoever goes to the mosque in the morning or evening, Allah prepares for him a place in Paradise." — Sahih al-Bukhari
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
  label: { fontSize: 14, fontFamily: FONTS.bodySemi, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 16, fontFamily: FONTS.body, marginBottom: 10,
  },
  prayerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  prayerChip: {
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  prayerText: { fontSize: 13, fontFamily: FONTS.bodySemi },
  addBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, paddingVertical: 10,
  },
  rowIcon: { fontSize: 24 },
  rowName: { fontSize: 15, fontFamily: FONTS.bodyBold },
});
