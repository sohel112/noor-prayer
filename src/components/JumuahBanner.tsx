// Deen — Jumu'ah (Friday) Greetings Banner
// Shows on Fridays: Jumu'ah Mubarak + Surah Kahf + Durood reminders

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Card, useTheme } from './ui';
import { FONTS } from '../lib/theme';

/** True if today is Friday (Jumu'ah). */
export function isFriday(): boolean {
  return new Date().getDay() === 5;
}

const JUMUAH_DUAS = [
  'Allahumma salli ala Muhammad wa ala aali Muhammad',
  'Surah Al-Kahf padhein — roshni milegi agle Jumu\'ah tak',
];

export const JumuahBanner = memo(function JumuahBanner() {
  const th = useTheme();
  if (!isFriday()) return null;

  return (
    <Card style={[styles.card, { backgroundColor: th.primary }]}>
      <Text style={styles.emoji}>🕌</Text>
      <Text style={styles.title}>Jumu'ah Mubarak!</Text>
      <Text style={styles.arabic}>جُمُعَة مُبَارَكَة</Text>
      <Text style={styles.subtitle}>
        Aaj Jumu'ah hai — Surah Al-Kahf padhein aur Durood Sharif kasrat se bhejein 🤲
      </Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          onPress={() => router.push('/surah/18')}
          style={[styles.btn, { backgroundColor: '#FFF' }]}
        >
          <Text style={[styles.btnText, { color: th.primary }]}>📖 Surah Al-Kahf</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/duas')}
          style={[styles.btn, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#FFF', borderWidth: 1 }]}
        >
          <Text style={[styles.btnText, { color: '#FFF' }]}>🤲 Duas</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hadith}>
        "Jo Jumu'ah ko Surah Al-Kahf padhe, uske liye do Jumu'ah ke darmiyan noor hoga." — Hakim
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bodyBold,
    color: '#FFF',
    marginBottom: 4,
  },
  arabic: {
    fontSize: 20,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  btn: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
  },
  hadith: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
