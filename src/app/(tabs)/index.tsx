// Deen — Home Dashboard (NOOR Clean UI)
// White cards on light gray, Playfair headings, memoized prayer widgets.

import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, useTheme, Heading, Sub, PrimaryButton, Arabic } from '../../components/ui';
import { AdBanner } from '../../components/AdBanner';
import { JumuahBanner } from '../../components/JumuahBanner';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { useLocation } from '../../lib/location';
import { calculatePrayerTimes, formatTime, type PrayerTimes } from '../../lib/prayerTimes';
import { toHijri, formatHijri } from '../../lib/hijri';
import { FONTS, type Theme } from '../../lib/theme';
import * as Notifications from 'expo-notifications';
import { reschedulePrayerNotifications } from '../../lib/notifications';
import ayahOfDayData from '../../../assets/data/ayahOfDay.json';

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
type PrayerName = (typeof PRAYER_ORDER)[number];

const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌌',
};

interface AyahOfDay { s: number; a: number; ar: string; en: string }

function ayahOfTheDay(): AyahOfDay {
  const all = ayahOfDayData as unknown as AyahOfDay[];
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start) / 86400000) % 366;
  return all[day % all.length];
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
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

/** Prayer display name (localized where the i18n key exists) */
function tName(name: PrayerName): string {
  const v = t(name, 'en');
  return v === name ? name[0].toUpperCase() + name.slice(1) : v;
}

/** Ticking HH:MM:SS countdown — isolated so only this component re-renders each second. */
function useCountdown(target: Date): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Memoized widgets
// ---------------------------------------------------------------------------

const NextPrayerCard = memo(function NextPrayerCard({ name, at, prayerTime, label }: {
  name: PrayerName; at: Date; prayerTime: string; label: string;
}) {
  const th = useTheme();
  const countdown = useCountdown(at);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/prayer-tracker')}>
      <Card style={styles.nextCard}>
        <Text style={[styles.nextLabel, { color: th.sub }]}>{label}</Text>
        <View style={styles.nextRow}>
          <View style={{ flex: 1 }}>
            <Heading size={34} style={{ marginBottom: 6 }}>{tName(name)}</Heading>
            <Text style={[styles.countdown, { color: th.primary, fontVariant: ['tabular-nums'] }]}>
              {countdown}
            </Text>
            <Text style={[styles.nextTime, { color: th.sub }]}>🕰 {prayerTime}</Text>
          </View>
          <View style={[styles.moonCircle, { backgroundColor: th.chip }]}>
            <Text style={{ fontSize: 44 }}>{PRAYER_ICONS[name]}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const PrayerStrip = memo(function PrayerStrip({ times, nextName, use24h }: {
  times: PrayerTimes; nextName: PrayerName; use24h: boolean;
}) {
  const th = useTheme();
  const { settings, update } = useSettings();

  const toggleAzan = (name: PrayerName) => {
    const next = {
      ...settings.notifications,
      [name]: !settings.notifications[name],
    };
    update({ notifications: next });
    // Re-schedule notifications so the change takes effect immediately.
    reschedulePrayerNotifications(times, times, { ...settings, notifications: next }).catch(() => {});
  };

  return (
    <View style={styles.strip}>
      {PRAYER_ORDER.map(name => {
        const isNext = name === nextName;
        const azanOn = settings.notifications[name] !== false;
        return (
          <View key={name} style={[styles.stripItem, isNext && { backgroundColor: th.primary }]}>
            <Text style={{ fontSize: 20 }}>{PRAYER_ICONS[name]}</Text>
            <Text style={[styles.stripName, { color: isNext ? '#FFFFFF' : th.text }]}>{tName(name)}</Text>
            <Text
              style={[styles.stripTime, { color: isNext ? '#FFFFFF' : th.sub, fontVariant: ['tabular-nums'] }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatTime(times[name], use24h)}
            </Text>
            <TouchableOpacity
              onPress={() => toggleAzan(name)}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 15, opacity: azanOn ? 1 : 0.35 }}>
                {azanOn ? '🔔' : '🔕'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
});

/** Days until the next big occasion: Ramadan, Eid al-Fitr, or Eid al-Adha (approx). */
const OccasionCountdown = memo(function OccasionCountdown({ hijriAdjust }: { hijriAdjust: number }) {
  const th = useTheme();
  const info = useMemo(() => {
    const now = toHijri(new Date(), hijriAdjust);
    const occasions = [
      { month: 9, day: 1, icon: '🌙', label: 'Ramadan' },
      { month: 10, day: 1, icon: '🎉', label: 'Eid al-Fitr' },
      { month: 12, day: 10, icon: '🕋', label: 'Eid al-Adha' },
    ];
    let best: { icon: string; label: string; days: number } | null = null;
    for (const o of occasions) {
      let months = o.month - now.month;
      if (months < 0 || (months === 0 && o.day <= now.day)) months += 12;
      const days = Math.max(0, Math.round(months * 29.53 + (o.day - now.day)));
      if (!best || days < best.days) best = { icon: o.icon, label: o.label, days };
    }
    return best;
  }, [hijriAdjust]);

  if (!info) return null;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 34 }}>{info.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: th.text, fontSize: 17, fontFamily: FONTS.bodySemi }}>
            {info.days === 0
              ? `${info.label} Mubarak! 🤲`
              : `${info.label} in ${info.days} day${info.days === 1 ? '' : 's'}`}
          </Text>
          <Sub>Based on the Hijri calendar (approx.)</Sub>
        </View>
      </View>
    </Card>
  );
});

const AyahCard = memo(function AyahCard({ th }: { th: Theme }) {  const ayah = useMemo(() => ayahOfTheDay(), []);
  return (
    <Card>
      <Text style={[styles.cardTitle, { color: th.text }]}>✨ {t('ayahOfDay', 'en')}</Text>
      <Arabic size={24}>{ayah.ar}</Arabic>
      <Text style={[styles.ayahEn, { color: th.text }]}>“{ayah.en}”</Text>
      <Text style={[styles.ayahRef, { color: th.sub }]}>(Qur&apos;an {ayah.s}:{ayah.a})</Text>
    </Card>
  );
});

const QUICK_ACTIONS = [
  { label: 'Quran', icon: '📖', route: '/(tabs)/quran' },
  { label: 'Audio', icon: '🔊', route: '/audio' },
  { label: 'Tasbih', icon: '📿', route: '/tasbih' },
  { label: 'Duas', icon: '🤲', route: '/(tabs)/duas' },
  { label: 'Qibla', icon: '🧭', route: '/qibla' },
] as const;

const QuickActions = memo(function QuickActions({ th }: { th: Theme }) {
  return (
    <View style={styles.quickRow}>
      {QUICK_ACTIONS.map(a => (
        <TouchableOpacity
          key={a.label}
          activeOpacity={0.7}
          style={styles.quickItem}
          onPress={() => router.push(a.route as never)}
        >
          <View style={[styles.quickCircle, { backgroundColor: th.primary + '1A' }]}>
            <Text style={{ fontSize: 26 }}>{a.icon}</Text>
          </View>
          <Text style={[styles.quickLabel, { color: th.text }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});
const ALL_FEATURES = [
  // Daily essentials
  { label: 'Prayer Tracker', icon: '✅', route: '/prayer-tracker' },
  { label: 'Adhkar', icon: '🌅', route: '/adhkar' },
  { label: '99 Names', icon: '✨', route: '/names' },
  { label: 'Hadith', icon: '📜', route: '/hadith' },
  // Regular use
  { label: 'Makkah Live', icon: '🕋', route: '/makkah' },
  { label: 'Mosque Finder', icon: '🕌', route: '/mosques' },
  { label: 'Halal Food', icon: '🍖', route: '/halal-food' },
  { label: 'Ramadan', icon: '🌙', route: '/ramadan' },
  { label: 'Fajr Alarm', icon: '⏰', route: '/fajr-alarm-settings' },
  // Trackers
  { label: 'Khatm Tracker', icon: '📖', route: '/khatm-tracker' },
  { label: 'Sadaqah', icon: '🤲', route: '/sadaqah-tracker' },
  { label: 'Tahajjud', icon: '⭐', route: '/tahajjud-tracker' },
  { label: 'Masjid Visits', icon: '🛐', route: '/masjid-visits' },
  { label: "I'tikaf", icon: '⛺', route: '/itikaf-tracker' },
  { label: 'Islamic Events', icon: '📅', route: '/islamic-events' },
  { label: 'Fasting Tracker', icon: '🍽️', route: '/fasting-tracker' },
  { label: 'Habit Tracker', icon: '📊', route: '/habit-tracker' },
  // Learning
  { label: 'Namaz Guide', icon: '🙏', route: '/namaz-guide' },
  { label: 'Islamic Quiz', icon: '❓', route: '/quiz' },
  { label: 'Hifz Planner', icon: '🧠', route: '/hifz-planner' },
  { label: 'Quran Search', icon: '🔍', route: '/quran-search' },
  { label: 'AI Chat', icon: '🤖', route: '/ai-chat' },
  // Personal
  { label: 'Gratitude Journal', icon: '📝', route: '/gratitude-journal' },
  { label: 'Cycle Tracker', icon: '🌸', route: '/cycle-tracker' },
  { label: 'Prayer Report', icon: '📈', route: '/prayer-report' },
  { label: 'Flip to Silence', icon: '📵', route: '/flip-to-silence' },
  // Occasional tools
  { label: 'Zakat Calc', icon: '💰', route: '/zakat' },
  { label: 'Waris Calc', icon: '⚖️', route: '/waris' },
  { label: 'Hijri Convert', icon: '🔄', route: '/converter' },
  { label: 'Settings', icon: '⚙️', route: '/settings' },
] as const;
// ---------------------------------------------------------------------------
// All features grid — most-used first
// ---------------------------------------------------------------------------



const FeaturesGrid = memo(function FeaturesGrid({ th }: { th: Theme }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.cardTitle, { color: th.text, marginBottom: 12 }]}>🌟 Features</Text>
      <View style={styles.featGrid}>
        {ALL_FEATURES.map(f => (
          <TouchableOpacity
            key={f.label}
            activeOpacity={0.7}
            style={[styles.featItem, { backgroundColor: th.card, borderColor: th.border }]}
            onPress={() => router.push(f.route as never)}
          >
            <Text style={{ fontSize: 28 }}>{f.icon}</Text>
            <Text style={[styles.featLabel, { color: th.text }]} numberOfLines={2}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function Home() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc } = useLocation();

  const today = useMemo(() => new Date(), []);
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

  const now = useMemo(() => new Date(), [today]);
  const next = useMemo(() => (times ? nextOfFive(times, now) : null), [times, now]);

  // Keep prayer-time notifications scheduled (today + tomorrow) whenever
  // location or calculation settings change. Replaces the old manual button.
  useEffect(() => {
    if (!loc || !times) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const tomorrow = calculatePrayerTimes(new Date(Date.now() + 86400000), loc.lat, loc.lng, {
          methodId: settings.methodId,
          asrJuristic: settings.asrJuristic,
          highLatitudeRule: settings.highLatitudeRule,
          adjustments: settings.adjustments,
          dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
        });
        await reschedulePrayerNotifications(times, tomorrow, settings);
      } catch { /* notifications are best-effort */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.lat, loc?.lng, settings.methodId, settings.asrJuristic, settings.highLatitudeRule, JSON.stringify(settings.adjustments), settings.dhuhrOffsetMinutes, JSON.stringify(settings.notifications), settings.azanSound, settings.quietFrom, settings.quietTo, settings.fajrForceWake]);

  return (
    <Screen edges={['top']}>
      {/* Top row: location + bell */}
      <View style={styles.topRow}>
        <View style={styles.locRow}>
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={[styles.locText, { color: th.text }]} numberOfLines={1}>
            {loc?.label ?? 'Set location'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.bellBtn, { backgroundColor: th.chip }]}
          onPress={() => router.push('/(tabs)/more')}
        >
          <Text style={{ fontSize: 20 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <Scroller>
        {/* Jumu'ah greetings on Fridays */}
        <JumuahBanner />
        {/* Date lines */}
        <View>
          <Text style={[styles.gregDate, { color: th.text }]}>{dateLabel(today)}</Text>
          <Text style={[styles.hijriDate, { color: th.sub }]}>
            {formatHijri(toHijri(today, settings.hijriAdjust), lang)}
          </Text>
        </View>

        {!loc || !times || !next ? (
          <Card>
            <Text style={[styles.cardTitle, { color: th.text }]}>📍 Location</Text>
            <Sub style={{ marginBottom: 12 }}>Set your location for accurate prayer times</Sub>
            <PrimaryButton label="Set location" onPress={() => router.push('/(tabs)/more')} icon="📍" />
          </Card>
        ) : (
          <>
            <NextPrayerCard
              name={next.name}
              at={next.at}
              prayerTime={formatTime(times[next.name], settings.use24h)}
              label={t('nextPrayer', lang)}
            />
            <PrayerStrip times={times} nextName={next.name} use24h={settings.use24h} />
            <OccasionCountdown hijriAdjust={settings.hijriAdjust} />
          </>
        )}

        <AyahCard th={th} />
        <QuickActions th={th} />
        <FeaturesGrid th={th} />
        <AdBanner />
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 12 },
  locText: { fontSize: 16, fontFamily: FONTS.bodySemi },
  bellBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  gregDate: { fontSize: 20, fontFamily: FONTS.bodySemi },
  hijriDate: { fontSize: 14, fontFamily: FONTS.body, marginTop: 2 },
  cardTitle: { fontSize: 17, fontFamily: FONTS.bodySemi, marginBottom: 10 },
  nextCard: { padding: 20 },
  nextLabel: { fontSize: 13, fontFamily: FONTS.bodySemi, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  countdown: { fontSize: 30, fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  nextTime: { fontSize: 14, fontFamily: FONTS.body, marginTop: 6 },
  moonCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  strip: { flexDirection: 'row', gap: 8 },
  stripItem: {
    flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4,
    alignItems: 'center', gap: 4,
  },
  stripName: { fontSize: 12, fontFamily: FONTS.bodySemi },
  stripTime: { fontSize: 11, fontFamily: FONTS.body },
  ayahEn: { fontSize: 15, lineHeight: 23, fontFamily: FONTS.body, marginTop: 12, fontStyle: 'italic' },
  ayahRef: { fontSize: 13, fontFamily: FONTS.bodyMedium, marginTop: 8 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  quickItem: { alignItems: 'center', gap: 8, minWidth: 64 },
  quickCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontFamily: FONTS.bodyMedium },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featItem: {
    width: '31%', borderRadius: 16, borderWidth: 1,
    paddingVertical: 14, alignItems: 'center', gap: 6,
  },
  featLabel: { fontSize: 12, fontFamily: FONTS.bodyMedium, textAlign: 'center' },
});
