import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
  type StyleProp, type ViewStyle, type TextStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useSettings } from '../lib/settings';
import { DARK, LIGHT, FONTS, Theme } from '../lib/theme';

export function useTheme(): Theme {
  const { settings } = useSettings();
  return settings.theme === 'dark' ? DARK : LIGHT;
}

export function Screen({ children, edges }: { children: React.ReactNode; edges?: Edge[] }) {
  const th = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: th.bg }]} edges={edges ?? ['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

export function Scroller({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const cardShadow = (th: Theme): ViewStyle => ({
  shadowColor: th.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
});

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  return (
    <View style={[styles.card, cardShadow(th), { backgroundColor: th.card }, style]}>
      {children}
    </View>
  );
}

/** Featured card with soft green tint (legacy name kept for compat) */
export function GoldCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  return (
    <View style={[styles.card, cardShadow(th), { backgroundColor: th.accentSoft, borderColor: th.accent, borderWidth: 1 }, style]}>
      {children}
    </View>
  );
}

/** Elegant serif heading (Playfair Display) */
export function Heading({ children, style, size = 26 }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number }) {
  const th = useTheme();
  return <Text style={[styles.heading, { color: th.text, fontSize: size }, style]}>{children}</Text>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const th = useTheme();
  return <Text style={[styles.title, { color: th.text }, style]}>{children}</Text>;
}

/** Small uppercase section label */
export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const th = useTheme();
  return <Text style={[styles.sectionTitle, { color: th.sub }, style]}>{children}</Text>;
}

export function Sub({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const th = useTheme();
  return <Text style={[styles.sub, { color: th.sub }, style]}>{children}</Text>;
}

/** Settings-style row with icon, label, hint and chevron */
export function RowButton({ label, hint, onPress, icon }: { label: string; hint?: string; onPress: () => void; icon?: string }) {
  const th = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.rowBtn, { backgroundColor: th.card, borderBottomColor: th.border }]}
    >
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: th.chip }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodyMedium }}>{label}</Text>
        {hint ? <Text style={{ color: th.sub, fontSize: 13, marginTop: 2, fontFamily: FONTS.body }}>{hint}</Text> : null}
      </View>
      <Text style={{ color: th.sub, fontSize: 22, fontFamily: FONTS.body }}>›</Text>
    </TouchableOpacity>
  );
}

/** Primary green button */
export function PrimaryButton({ label, onPress, style, icon }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; icon?: string }) {
  const th = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.primaryBtn, { backgroundColor: th.primary }, style]}
    >
      {icon ? <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text> : null}
      <Text style={[styles.primaryBtnText, { color: th.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Legacy name — same as PrimaryButton */
export function GoldButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return <PrimaryButton label={label} onPress={onPress} style={style} />;
}

/** Pill tab row */
export function PillTabs<T extends string>({ options, value, onChange, labels }: {
  options: readonly T[]; value: T; onChange: (v: T) => void; labels?: Record<string, string>;
}) {
  const th = useTheme();
  return (
    <View style={[styles.pillRow, { backgroundColor: th.chip }]}>
      {options.map(o => {
        const active = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            activeOpacity={0.8}
            style={[styles.pill, active && { backgroundColor: th.primary }]}
          >
            <Text style={{ color: active ? th.onPrimary : th.sub, fontFamily: FONTS.bodySemi, fontSize: 13 }}>
              {labels?.[o] ?? o}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Toggle row for notification/settings screens */
export function ToggleRow({ label, hint, value, onChange, icon }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; icon?: string;
}) {
  const th = useTheme();
  return (
    <View style={[styles.toggleRow, { backgroundColor: th.card, borderBottomColor: th.border }]}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: th.chip }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodyMedium }}>{label}</Text>
        {hint ? <Text style={{ color: th.sub, fontSize: 13, marginTop: 2, fontFamily: FONTS.body }}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: th.border, true: th.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

/** Screen header with optional back button */
export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ color: th.text, fontSize: 22, fontFamily: FONTS.body }}>‹</Text>
        </TouchableOpacity>
      ) : <View style={styles.backBtn} />}
      <Text style={{ color: th.text, fontSize: 19, fontFamily: FONTS.bodySemi }}>{title}</Text>
      <View style={styles.backBtn}>{right}</View>
    </View>
  );
}

export function Arabic({ children, size = 22, style }: { children: React.ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  const th = useTheme();
  return (
    <Text style={[{ color: th.text, fontSize: size, lineHeight: size * 1.9, textAlign: 'right', writingDirection: 'rtl' }, style]}>
      {children}
    </Text>
  );
}

/** DEEN brand mark — masjid arch + wordmark */
export function DeenMark({ size = 64, color }: { size?: number; color?: string }) {
  const th = useTheme();
  const c = color ?? th.primary;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: size, color: c, lineHeight: size * 1.1 }}>◠</Text>
      <Text style={{
        fontSize: size * 0.52, color: c, fontFamily: FONTS.heading,
        letterSpacing: size * 0.18, marginTop: -size * 0.12,
      }}>
        DEEN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  card: { borderRadius: 18, padding: 18 },
  heading: { fontFamily: FONTS.heading, marginBottom: 4, letterSpacing: 0.2 },
  title: { fontSize: 22, fontFamily: FONTS.bodySemi, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontFamily: FONTS.bodySemi, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  sub: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.body },
  rowBtn: {
    borderBottomWidth: 1,
    paddingVertical: 14, paddingHorizontal: 4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  rowIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleRow: {
    borderBottomWidth: 1,
    paddingVertical: 12, paddingHorizontal: 4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  primaryBtn: {
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#0F6B4F', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  primaryBtnText: { fontFamily: FONTS.bodySemi, fontSize: 16, letterSpacing: 0.3 },
  pillRow: {
    flexDirection: 'row', borderRadius: 999,
    padding: 4, gap: 4, alignSelf: 'flex-start',
  },
  pill: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
