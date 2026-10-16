// Deen — Gratitude Journal (Shukr Journal)
// "If you are grateful, I will surely increase you" — Quran 14:7

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

interface Entry {
  id: string;
  date: string;
  text: string;
}

const STORE_KEY = 'gratitudeJournal';
const VERSES = [
  { ar: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', en: '"If you are grateful, I will surely increase you." — Quran 14:7' },
  { ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي', en: '"Remember Me, I will remember you. Be grateful to Me." — Quran 2:152' },
];

export default function GratitudeJournal() {
  const th = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [verseIdx] = useState(() => Math.floor(Math.random() * VERSES.length));

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) setEntries(JSON.parse(raw));
    });
  }, []);

  const save = async (newEntries: Entry[]) => {
    setEntries(newEntries);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(newEntries));
  };

  const addEntry = async () => {
    const text = input.trim();
    if (!text) return;
    const entry: Entry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      text,
    };
    setInput('');
    await save([entry, ...entries]);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete?', 'Remove this gratitude entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(entries.filter(e => e.id !== id)) },
    ]);
  };

  const verse = VERSES[verseIdx];
  const streak = entries.length; // simple count

  return (
    <Screen edges={['top']}>
      <TopBar title="🙏 Shukr Journal" onBack={() => router.back()} />
      <Scroller>
        {/* Verse */}
        <Card style={[styles.verseCard, { backgroundColor: th.accentSoft }]}>
          <Text style={[styles.arabic, { color: th.text }]}>{verse.ar}</Text>
          <Sub style={{ textAlign: 'center', marginTop: 8 }}>{verse.en}</Sub>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statNum, { color: th.primary }]}>{entries.length}</Text>
            <Sub>Total Entries</Sub>
          </Card>
        </View>

        {/* Add entry */}
        <SectionTitle>What are you grateful for today?</SectionTitle>
        <Card>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Alhamdulillah for..."
            placeholderTextColor={th.sub}
            multiline
            numberOfLines={3}
            style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
          />
          <TouchableOpacity
            onPress={addEntry}
            disabled={!input.trim()}
            style={[styles.addBtn, { backgroundColor: th.primary, opacity: input.trim() ? 1 : 0.4 }]}
          >
            <Text style={styles.addBtnText}>+ Add Gratitude</Text>
          </TouchableOpacity>
        </Card>

        {/* Entries */}
        <SectionTitle>Your Blessings</SectionTitle>
        {entries.length === 0 ? (
          <Card>
            <Sub style={{ textAlign: 'center', paddingVertical: 16 }}>
              No entries yet. Start by writing one thing you're grateful for! 🤲
            </Sub>
          </Card>
        ) : (
          entries.map(e => (
            <Card key={e.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={[styles.entryDate, { color: th.accent }]}>📅 {e.date}</Text>
                <TouchableOpacity onPress={() => deleteEntry(e.id)}>
                  <Text style={{ color: th.sub, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.entryText, { color: th.text }]}>{e.text}</Text>
            </Card>
          ))
        )}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  verseCard: { padding: 20, alignItems: 'center', borderRadius: 16 },
  arabic: { fontSize: 22, textAlign: 'center', fontFamily: FONTS.body },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontSize: 28, fontFamily: FONTS.bodyBold },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 15, minHeight: 80, textAlignVertical: 'top',
    marginBottom: 12,
  },
  addBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  entryCard: { marginBottom: 8 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entryDate: { fontSize: 13, fontFamily: FONTS.bodySemi },
  entryText: { fontSize: 15, lineHeight: 22 },
});
