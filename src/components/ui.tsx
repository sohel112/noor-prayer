import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../lib/settings';
import { DARK, LIGHT, Theme } from '../lib/theme';

export function useTheme(): Theme {
  const { settings } = useSettings();
  return settings.theme === 'dark' ? DARK : LIGHT;
}

export function Screen({ children }: { children: React.ReactNode }) {
  const th = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: th.bg }]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

export function Scroller({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const th = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: th.card, borderColor: th.border }, style]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const th = useTheme();
  return <Text style={[styles.title, { color: th.text }]}>{children}</Text>;
}

export function Sub({ children, style }: { children: React.ReactNode; style?: object }) {
  const th = useTheme();
  return <Text style={[styles.sub, { color: th.sub }, style]}>{children}</Text>;
}

export function RowButton({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.rowBtn, { backgroundColor: th.card, borderColor: th.border }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: th.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        {hint ? <Text style={{ color: th.sub, fontSize: 13, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <Text style={{ color: th.sub, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

export function Arabic({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  const th = useTheme();
  return (
    <Text style={{ color: th.text, fontSize: size, lineHeight: size * 1.9, textAlign: 'right', writingDirection: 'rtl' }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20 },
  rowBtn: {
    borderRadius: 14, padding: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
  },
});
