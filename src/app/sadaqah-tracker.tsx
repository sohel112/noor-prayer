// Deen — Sadaqah / Charity Tracker
// Log donations with amount, date & note. Totals + history, local storage.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'sadaqahDonations';

interface Donation {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SadaqahTracker() {
  const th = useTheme();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) setDonations(JSON.parse(raw));
    });
  }, []);

  const save = async (list: Donation[]) => {
    setDonations(list);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(list));
  };

  const addDonation = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid donation amount.');
      return;
    }
    const entry: Donation = {
      id: `${Date.now()}`,
      amount: Math.round(value * 100) / 100,
      date: todayStr(),
      note: note.trim(),
    };
    await save([entry, ...donations]);
    setAmount('');
    setNote('');
  };

  const removeDonation = async (id: string) => {
    await save(donations.filter(d => d.id !== id));
  };

  const { total, monthTotal } = useMemo(() => {
    const total = donations.reduce((s, d) => s + d.amount, 0);
    const monthPrefix = todayStr().slice(0, 7);
    const monthTotal = donations
      .filter(d => d.date.startsWith(monthPrefix))
      .reduce((s, d) => s + d.amount, 0);
    return { total, monthTotal };
  }, [donations]);

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <Screen edges={['top']}>
      <TopBar title="💰 Sadaqah Tracker" onBack={() => router.back()} />
      <Scroller>
        {/* Totals */}
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{fmt(total)}</Text>
              <Sub>Total Given</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{fmt(monthTotal)}</Text>
              <Sub>This Month</Sub>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: th.primary }]}>{donations.length}</Text>
              <Sub>Donations</Sub>
            </View>
          </View>
        </Card>

        {/* Add donation */}
        <SectionTitle>Log a Donation</SectionTitle>
        <Card>
          <Text style={[styles.label, { color: th.text }]}>Amount (₹)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g. 100"
            placeholderTextColor={th.sub}
            style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
          />
          <Text style={[styles.label, { color: th.text }]}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Masjid fund, food for needy"
            placeholderTextColor={th.sub}
            style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
          />
          <TouchableOpacity
            onPress={addDonation}
            style={[styles.addBtn, { backgroundColor: th.primary }]}
          >
            <Text style={styles.addBtnText}>💰 Log Donation</Text>
          </TouchableOpacity>
        </Card>

        {/* History */}
        <SectionTitle>History</SectionTitle>
        <Card>
          {donations.length === 0 ? (
            <Sub style={{ textAlign: 'center', paddingVertical: 16 }}>
              No donations logged yet. Every rupee counts! 🤲
            </Sub>
          ) : (
            donations.map(d => (
              <View key={d.id} style={[styles.row, { borderColor: th.border }]}>
                <Text style={styles.rowIcon}>💰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowAmount, { color: th.text }]}>{fmt(d.amount)}</Text>
                  <Sub>{d.date}{d.note ? ` • ${d.note}` : ''}</Sub>
                </View>
                <TouchableOpacity onPress={() => removeDonation(d.id)}>
                  <Text style={{ color: th.sub, fontSize: 20 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "Charity does not decrease wealth." — Sahih Muslim
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsCard: { paddingVertical: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontFamily: FONTS.bodyBold },
  label: { fontSize: 14, fontFamily: FONTS.bodySemi, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 16, fontFamily: FONTS.body, marginBottom: 10,
  },
  addBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  addBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, paddingVertical: 10,
  },
  rowIcon: { fontSize: 22 },
  rowAmount: { fontSize: 15, fontFamily: FONTS.bodyBold },
});
