// Deen — I'tikaf Tracker
// For Ramadan's last 10 days: daily check-in, intentions, progress.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'itikafTracker';

interface ItikafState {
  year: number; // Hijri-ish label, e.g. 2026 season
  intention: string;
  days: boolean[]; // 10 entries, one per night of last 10 days
  notes: string[];
}

const NIGHT_LABELS = [
  '21st Night', '22nd Night', '23rd Night', '24th Night', '25th Night',
  '26th Night', '27th Night', '28th Night', '29th Night', '30th Night',
];

const INTENTIONS = [
  { key: 'masjid', label: 'Full 10 days in Masjid', icon: '🕌' },
  { key: 'home', label: 'Nights at home (women/elderly)', icon: '🏠' },
  { key: 'partial', label: 'As many nights as possible', icon: '🌙' },
];

function blankState(): ItikafState {
  return {
    year: new Date().getFullYear(),
    intention: '',
    days: Array(10).fill(false),
    notes: Array(10).fill(''),
  };
}

export default function ItikafTracker() {
  const th = useTheme();
  const [state, setState] = useState<ItikafState>(blankState());
  const [loaded, setLoaded] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Reset each Ramadan season (new year => fresh)
        if (parsed.year === new Date().getFullYear()) {
          setState({ ...blankState(), ...parsed });
        }
      }
    } catch {
      // keep blank
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const save = useCallback(async (s: ItikafState) => {
    setState(s);
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(s));
  }, []);

  const toggleDay = useCallback((i: number) => {
    const days = [...state.days];
    days[i] = !days[i];
    save({ ...state, days });
  }, [state, save]);

  const setIntention = useCallback((key: string) => {
    save({ ...state, intention: key });
  }, [state, save]);

  const saveNote = useCallback(() => {
    if (editingNote === null) return;
    const notes = [...state.notes];
    notes[editingNote] = noteText.trim();
    save({ ...state, notes });
    setEditingNote(null);
    setNoteText('');
  }, [editingNote, noteText, state, save]);

  const progress = useMemo(() => {
    const done = state.days.filter(Boolean).length;
    return { done, pct: Math.round((done / 10) * 100) };
  }, [state.days]);

  if (!loaded) {
    return (
      <Screen edges={['top']}>
        <TopBar title="🕌 I'tikaf Tracker" onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <TopBar title="🕌 I'tikaf Tracker" onBack={() => router.back()} />
      <Scroller>
        {/* Progress */}
        <Card style={[styles.heroCard, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
          <View style={styles.heroRow}>
            <Text style={[styles.heroPct, { color: th.primary }]}>{progress.pct}%</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: th.text }]}>
                {progress.done} / 10 Nights Completed
              </Text>
              <Sub>Last 10 nights of Ramadan — seek Laylat al-Qadr</Sub>
            </View>
          </View>
          <View style={[styles.barTrack, { backgroundColor: th.border }]}>
            <View
              style={[styles.barFill, { width: `${progress.pct}%`, backgroundColor: th.primary }]}
            />
          </View>
        </Card>

        {/* Intention */}
        <SectionTitle>Your Intention</SectionTitle>
        <Card>
          {INTENTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setIntention(opt.key)}
              style={[
                styles.optRow,
                { borderColor: th.border },
                state.intention === opt.key && {
                  backgroundColor: th.accentSoft, borderColor: th.accent,
                },
              ]}
            >
              <Text style={styles.optIcon}>{opt.icon}</Text>
              <Text style={[styles.optLabel, { color: th.text }]}>{opt.label}</Text>
              {state.intention === opt.key && (
                <Text style={{ color: th.primary, fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Nights */}
        <SectionTitle>Night Check-in</SectionTitle>
        <Card>
          {NIGHT_LABELS.map((label, i) => {
            const done = state.days[i];
            const isOdd = i % 2 === 0; // 21,23,25,27,29
            return (
              <View key={label}>
                <TouchableOpacity
                  onPress={() => toggleDay(i)}
                  style={[styles.nightRow, { borderColor: th.border }]}
                >
                  <View
                    style={[
                      styles.nightBox,
                      {
                        backgroundColor: done ? th.primary : 'transparent',
                        borderColor: done ? th.primary : th.border,
                      },
                    ]}
                  >
                    {done && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nightLabel, { color: th.text }]}>
                      {label} {isOdd && <Text style={{ color: th.accent }}>✨</Text>}
                    </Text>
                    {state.notes[i] ? <Sub>📝 {state.notes[i]}</Sub> : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingNote(i);
                      setNoteText(state.notes[i] ?? '');
                    }}
                  >
                    <Text style={{ color: th.sub, fontSize: 16 }}>📝</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {editingNote === i && (
                  <View style={styles.noteBox}>
                    <TextInput
                      value={noteText}
                      onChangeText={setNoteText}
                      placeholder="Duas made, reflections..."
                      placeholderTextColor={th.sub}
                      style={[
                        styles.noteInput,
                        { color: th.text, borderColor: th.border, backgroundColor: th.bg },
                      ]}
                    />
                    <TouchableOpacity
                      onPress={saveNote}
                      style={[styles.noteSave, { backgroundColor: th.primary }]}
                    >
                      <Text style={styles.noteSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        <TouchableOpacity
          onPress={() => save(blankState())}
          style={[styles.resetBtn, { borderColor: th.border }]}
        >
          <Text style={[styles.resetText, { color: th.sub }]}>↺ Reset for new Ramadan</Text>
        </TouchableOpacity>

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "The Prophet ﷺ used to observe I'tikaf during the last ten days of Ramadan." — Sahih al-Bukhari
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderWidth: 1, padding: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  heroPct: { fontSize: 34, fontFamily: FONTS.bodyBold },
  heroTitle: { fontSize: 16, fontFamily: FONTS.bodySemi },
  barTrack: { height: 10, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  optRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  optIcon: { fontSize: 24 },
  optLabel: { fontSize: 15, fontFamily: FONTS.bodySemi, flex: 1 },
  nightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, paddingVertical: 10,
  },
  nightBox: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bodyBold },
  nightLabel: { fontSize: 15, fontFamily: FONTS.bodySemi },
  noteBox: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  noteInput: {
    flex: 1, borderWidth: 1, borderRadius: 10, padding: 10,
    fontSize: 14, fontFamily: FONTS.body,
  },
  noteSave: { borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  noteSaveText: { color: '#FFF', fontFamily: FONTS.bodyBold },
  resetBtn: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    alignItems: 'center', marginTop: 12,
  },
  resetText: { fontSize: 14, fontFamily: FONTS.bodySemi },
});
