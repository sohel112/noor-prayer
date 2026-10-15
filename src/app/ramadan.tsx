import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import {
  Screen, Scroller, Card, Title, Sub, SectionTitle, Arabic, GoldButton, useTheme,
} from '../components/ui';
import { useSettings } from '../lib/settings';
import { useLocation } from '../lib/location';
import { calculatePrayerTimes, formatTime, type PrayerTimes } from '../lib/prayerTimes';
import { formatHijri } from '../lib/hijri';
import {
  ramadanNow, loadRamadan, saveRamadan, ODD_NIGHTS, RAMADAN_DUAS,
  type RamadanStore,
} from '../lib/ramadan';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "02:34:15" countdown text between two dates. */
function countdownText(target: Date, now: Date): string {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function atTime(base: Date, fracHours: number): Date {
  const d = new Date(base);
  d.setHours(Math.floor(fracHours), Math.floor((fracHours % 1) * 60), 0, 0);
  return d;
}

interface SehriIftar {
  label: string;
  target: Date;
  doneLabel: string | null;
}

/** Decide what the countdown is counting to: sehri end (fajr) or iftar (maghrib). */
function sehriIftarState(times: PrayerTimes, tomorrow: PrayerTimes, now: Date): SehriIftar {
  const fajr = atTime(now, times.fajr);
  const maghrib = atTime(now, times.maghrib);
  if (now.getTime() < fajr.getTime()) {
    return { label: 'Sehri ends in', target: fajr, doneLabel: null };
  }
  if (now.getTime() < maghrib.getTime()) {
    return { label: 'Iftar in', target: maghrib, doneLabel: null };
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return {
    label: 'Sehri in',
    target: atTime(next, tomorrow.fajr),
    doneLabel: 'Iftar done — taqabbal Allahu minna wa minkum',
  };
}

// ---------------------------------------------------------------------------
// Day cell — module-level on purpose (defining inside the screen remounts
// inputs on every keystroke / re-render and breaks taps).
// ---------------------------------------------------------------------------
function DayCell({
  day, fast, taraweeh, isToday, isOddNight, onToggleFast, onToggleTaraweeh,
}: {
  day: number;
  fast: boolean;
  taraweeh: boolean;
  isToday: boolean;
  isOddNight: boolean;
  onToggleFast: () => void;
  onToggleTaraweeh: () => void;
}) {
  const th = useTheme();
  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: fast ? th.accentSoft : th.card,
          borderColor: isToday ? th.gold : isOddNight ? th.accent : th.border,
          borderWidth: isToday || isOddNight ? 2 : 1,
        },
      ]}
    >
      <TouchableOpacity onPress={onToggleFast} activeOpacity={0.7} style={styles.cellMain}>
        <Text style={[styles.cellDay, { color: th.text }]}>{day}</Text>
        <Text style={styles.cellMark}>{fast ? '✅' : '·'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleTaraweeh} activeOpacity={0.7} style={styles.cellSub}>
        <Text style={[styles.cellT, { color: taraweeh ? th.gold : th.sub }]}>
          {taraweeh ? '🕌' : '○'}
        </Text>
      </TouchableOpacity>
      {isOddNight ? <Text style={styles.cellMoon}>🌙</Text> : null}
    </View>
  );
}

export default function Ramadan() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc, loading, useGps: requestGps } = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [store, setStore] = useState<RamadanStore>({});

  // Live ticking countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadRamadan().then(setStore);
  }, []);

  const rNow = useMemo(
    () => ramadanNow(now, settings.hijriAdjust),
    [now, settings.hijriAdjust],
  );

  const calcOpts = useMemo(() => ({
    methodId: settings.methodId,
    asrJuristic: settings.asrJuristic,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.adjustments,
    dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
  }), [settings]);

  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const times = useMemo(
    () => (loc ? calculatePrayerTimes(now, loc.lat, loc.lng, calcOpts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loc, calcOpts, dayKey],
  );
  const tomorrowTimes = useMemo(() => {
    if (!loc) return null;
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return calculatePrayerTimes(t, loc.lat, loc.lng, calcOpts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc, calcOpts, dayKey]);

  const si = useMemo(
    () => (times && tomorrowTimes ? sehriIftarState(times, tomorrowTimes, now) : null),
    [times, tomorrowTimes, now],
  );

  const yearKey = String(rNow.hijriYear);
  const yearData = store[yearKey] ?? {};
  const fastCount = Object.values(yearData).filter(d => d.fast).length;
  const taraweehCount = Object.values(yearData).filter(d => d.taraweeh).length;

  const toggle = async (day: number, field: 'fast' | 'taraweeh') => {
    const next: RamadanStore = {
      ...store,
      [yearKey]: {
        ...(store[yearKey] ?? {}),
        [day]: { ...(store[yearKey]?.[day] ?? {}), [field]: !(store[yearKey]?.[day]?.[field]) },
      },
    };
    setStore(next);
    await saveRamadan(next);
  };

  const onGps = async () => {
    const ok = await requestGps();
    if (!ok) Alert.alert('Permission needed', 'Please allow location access in system settings.');
  };

  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  return (
    <Screen>
      <Scroller>
        <Title>🌙 Ramadan Hub</Title>
        <Sub style={{ marginBottom: 2 }}>
          {formatHijri(rNow.hijri, lang)}
          {rNow.isRamadan ? ` · Day ${rNow.ramadanDay} of Ramadan` : ' · Ramadan Kareem'}
        </Sub>

        {/* Sehri / Iftar countdown */}
        {!loc && !loading ? (
          <Card>
            <Sub>Set your location for accurate Sehri & Iftar times.</Sub>
            <GoldButton label="📍 Use GPS location" onPress={onGps} style={{ marginTop: 12 }} />
          </Card>
        ) : null}
        {si && times ? (
          <Card style={[styles.hero, { borderColor: th.gold }]}>
            <SectionTitle>{si.label.toUpperCase()}</SectionTitle>
            <Text style={[styles.countdown, { color: th.gold }]}>
              {countdownText(si.target, now)}
            </Text>
            <Sub>
              Sehri ends {formatTime(times.fajr, settings.use24h)} · Iftar {formatTime(times.maghrib, settings.use24h)}
            </Sub>
            {si.doneLabel ? (
              <Text style={{ color: th.gold, fontWeight: '700', marginTop: 8 }}>{si.doneLabel}</Text>
            ) : null}
          </Card>
        ) : null}

        {/* Laylatul Qadr banner */}
        {rNow.isLastTen ? (
          <Card style={[styles.hero, { borderColor: th.gold, backgroundColor: th.accentSoft }]}>
            <Text style={[styles.qadrTitle, { color: th.gold }]}>🌙 Last 10 nights</Text>
            <Sub>Seek Laylatul Qadr in the odd nights — 21, 23, 25, 27, 29.</Sub>
          </Card>
        ) : null}

        {/* 30-day tracker */}
        <SectionTitle>30-DAY TRACKER</SectionTitle>
        <Card>
          <Sub style={{ marginBottom: 8 }}>
            Tap a day for ✅ fast · tap 🕌/○ for taraweeh · {fastCount}/30 fasts · {taraweehCount}/30 taraweeh
          </Sub>
          <View style={styles.grid}>
            {days.map(day => (
              <DayCell
                key={day}
                day={day}
                fast={!!yearData[day]?.fast}
                taraweeh={!!yearData[day]?.taraweeh}
                isToday={rNow.ramadanDay === day}
                isOddNight={ODD_NIGHTS.includes(day)}
                onToggleFast={() => toggle(day, 'fast')}
                onToggleTaraweeh={() => toggle(day, 'taraweeh')}
              />
            ))}
          </View>
          <Sub style={{ marginTop: 8 }}>🌙 marks the odd nights — the best nights to seek Laylatul Qadr.</Sub>
        </Card>

        {/* Ramadan duas */}
        <SectionTitle>RAMADAN DUAS</SectionTitle>
        {RAMADAN_DUAS.map(d => (
          <Card key={d.id}>
            <Sub style={{ fontWeight: '700', color: th.gold }}>{d.title}</Sub>
            <Arabic>{d.ar}</Arabic>
            <Sub style={{ marginTop: 8 }}>{lang === 'ur' ? d.ur : d.en}</Sub>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 20,
  },
  countdown: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  qadrTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  cell: {
    width: '18%',
    aspectRatio: 0.92,
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellMain: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  cellDay: { fontSize: 15, fontWeight: '700' },
  cellMark: { fontSize: 13, marginTop: 2 },
  cellSub: { paddingVertical: 2 },
  cellT: { fontSize: 11 },
  cellMoon: { position: 'absolute', top: 2, right: 4, fontSize: 10 },
});
