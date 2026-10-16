// Deen — Prayer Tracker (NOOR Clean UI)
// Stack screen: today's prayer checklist + 7-day progress, persisted on-device.

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, useTheme, TopBar, Sub, PrimaryButton } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { useLocation } from '../lib/location';
import { calculatePrayerTimes, formatTime, type PrayerTimes } from '../lib/prayerTimes';
import { FONTS } from '../lib/theme';
import { AdBanner } from '../components/AdBanner';

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type PrayerName = (typeof PRAYER_ORDER)[number];


// Sunnah rakats per prayer: [before, after]
const SUNNAH_RAKATS: Record<PrayerName, { before: number; after: number }> = {
  fajr: { before: 2, after: 0 },
  dhuhr: { before: 4, after: 2 },
  asr: { before: 4, after: 0 },
  maghrib: { before: 0, after: 2 },
  isha: { before: 4, after: 2 },
};

// Nafl prayers (optional)
const NAFL_PRAYERS = [
  { id: 'tahajjud', name: 'Tahajjud', icon: '🌙', desc: 'Late night prayer' },
  { id: 'witr', name: 'Witr', icon: '⭐', desc: '3 rakats after Isha' },
  { id: 'ishraq', name: 'Ishraq', icon: '🌅', desc: 'After sunrise' },
  { id: 'chasht', name: 'Chasht (Duha)', icon: '☀️', desc: 'Mid-morning' },
  { id: 'awwabin', name: 'Awwabin', icon: '🌇', desc: 'After Maghrib' },
] as const;
type NaflId = (typeof NAFL_PRAYERS)[number]['id'];
const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌌',
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function storageKey(d: Date): string {
  return `prayerDone:${dayKey(d)}`;
}

function prayerDate(times: PrayerTimes, name: PrayerName, base: Date): Date {
  const at = new Date(base);
  at.setHours(Math.floor(times[name]), Math.floor((times[name] % 1) * 60), 0, 0);
  return at;
}

/** Next of the five daily prayers (sunrise excluded) — wraps to tomorrow's Fajr. */
function nextOfFive(times: PrayerTimes, now: Date): { name: PrayerName; at: Date } {
  for (const name of PRAYER_ORDER) {
    const at = prayerDate(times, name, now);
    if (at.getTime() > now.getTime()) return { name, at };
  }
  const at = prayerDate(times, 'fajr', now);
  at.setDate(at.getDate() + 1);
  return { name: 'fajr', at };
}

function tName(name: PrayerName): string {
  const v = t(name, 'en');
  return v === name ? name[0].toUpperCase() + name.slice(1) : v;
}

// ---------------------------------------------------------------------------

const PrayerRow = memo(function PrayerRow({ name, time, status, onToggle }: {
  name: PrayerName; time: string; status: 'done' | 'now' | 'upcoming'; onToggle: () => void;
}) {
  const th = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[
        styles.row,
        { backgroundColor: th.card, borderBottomColor: th.border },
        status === 'now' && { backgroundColor: th.accentSoft, borderColor: th.accent, borderWidth: 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: th.chip }]}>
        <Text style={{ fontSize: 20 }}>{PRAYER_ICONS[name]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodySemi }}>{tName(name)}</Text>
        <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body, marginTop: 1 }}>{time}</Text>
      </View>
      {status === 'done' ? (
        <View style={[styles.statusBadge, { backgroundColor: th.primary }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: FONTS.bodySemi }}>✓ Done</Text>
        </View>
      ) : status === 'now' ? (
        <View style={[styles.statusBadge, { backgroundColor: th.accent }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: FONTS.bodySemi }}>Now</Text>
        </View>
      ) : (
        <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body }}>Upcoming</Text>
      )}
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------

export default function PrayerTracker() {
  const { settings } = useSettings();
  const th = useTheme();
  const { loc } = useLocation();

  const today = useMemo(() => new Date(), []);
  const [done, setDone] = useState<PrayerName[]>([]);
  const [weekFull, setWeekFull] = useState<boolean[]>(Array(7).fill(false));

  const times: PrayerTimes | null = useMemo(() => {
    if (!loc) return null;
    return calculatePrayerTimes(today, loc.lat, loc.lng, {
      methodId: settings.methodId,
      asrJuristic: settings.asrJuristic,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.adjustments,
      dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
    });
  }, [loc, settings.methodId, settings.asrJuristic, settings.highLatitudeRule, settings.adjustments, settings.dhuhrOffsetMinutes, today]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey(today));
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setDone(arr.filter(p => (PRAYER_ORDER as readonly string[]).includes(p)) as PrayerName[]);
      // Weekly progress: full day = all 5 prayers done
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const keys = days.map(storageKey);
      const pairs = await AsyncStorage.multiGet(keys);
      setWeekFull(pairs.map(([, v]) => {
        const arr2 = v ? (JSON.parse(v) as string[]) : [];
        return arr2.length >= PRAYER_ORDER.length;
      }));
    } catch {
      setDone([]);
    }
  }, [today]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const toggle = useCallback(async (name: PrayerName) => {
    setDone(prev => {
      const next = prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name];
      AsyncStorage.setItem(storageKey(today), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [today]);

  const now = useMemo(() => new Date(), [today]);
  const nextName: PrayerName | null = useMemo(
    () => (times ? nextOfFive(times, now).name : null),
    [times, now],
  );

  const datePill = today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fullDays = weekFull.filter(Boolean).length;
  const weekDays = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-GB', { weekday: 'narrow' });
    });
  }, [today]);

  return (
    <Screen edges={['top']}>
      <TopBar title={t('prayerTracker', 'en') === 'prayerTracker' ? 'Prayer Tracker' : t('prayerTracker', 'en')} onBack={() => router.back()} />
      <Scroller>
        {/* Date pill */}
        <View style={[styles.datePill, { backgroundColor: th.primary }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bodySemi }}>{datePill}</Text>
        </View>

        {!times ? (
          <Card>
            <Text style={[styles.cardTitle, { color: th.text }]}>📍 Location</Text>
            <Sub style={{ marginBottom: 12 }}>Set your location for accurate prayer times</Sub>
            <PrimaryButton label="Set location" onPress={() => router.push('/(tabs)/more')} icon="📍" />
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {PRAYER_ORDER.map((name, i) => {
              const status: 'done' | 'now' | 'upcoming' =
                done.includes(name) ? 'done' : name === nextName ? 'now' : 'upcoming';
              return (
                <View key={name} style={i === PRAYER_ORDER.length - 1 && { marginBottom: -14 }}>
                  <PrayerRow
                    name={name}
                    time={formatTime(times[name], settings.use24h)}
                    status={status}
                    onToggle={() => toggle(name)}
                  />
                </View>
              );
            })}
          </Card>
        )}

        {/* Weekly progress */}
        <Card>
          <View style={styles.weekHeader}>
            <Text style={[styles.cardTitle, { color: th.text, marginBottom: 0 }]}>Weekly Progress</Text>
            <Text style={[styles.weekCount, { color: th.primary, fontVariant: ['tabular-nums'] }]}>
              {fullDays}/7
            </Text>
          </View>
          <View style={styles.weekRow}>
            {weekFull.map((full, i) => (
              <View key={i} style={styles.weekItem}>
                <View style={[
                  styles.weekCircle,
                  { backgroundColor: full ? th.primary : th.chip },
                ]}>
                  <Text style={{ color: full ? '#FFFFFF' : th.sub, fontSize: full ? 16 : 13, fontFamily: FONTS.bodySemi }}>
                    {full ? '✓' : weekDays[i]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.motivation, { backgroundColor: th.accentSoft }]}>
            <Text style={{ fontSize: 18 }}>🌱</Text>
            <Text style={[styles.motivationText, { color: th.text }]}>
              Consistency brings you closer to Allah
            </Text>
          </View>
        </Card>

        {/* Monthly report */}
        <PrimaryButton
          label="📊 Monthly Report"
          onPress={() => router.push('/prayer-report')}
          icon="📊"
        />
        <AdBanner />
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  datePill: {
    alignSelf: 'center', borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 22,
  },
  cardTitle: { fontSize: 17, fontFamily: FONTS.bodySemi, marginBottom: 10 },
  listCard: { padding: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 12,
    borderBottomWidth: 1, borderRadius: 12,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  weekCount: { fontSize: 18, fontFamily: FONTS.bodyBold },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  weekItem: { alignItems: 'center' },
  weekCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  motivation: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14,
  },
  motivationText: { fontSize: 14, fontFamily: FONTS.bodyMedium, flex: 1, lineHeight: 20 },
});
