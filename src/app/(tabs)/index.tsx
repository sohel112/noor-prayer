import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { useLocation } from '../../lib/location';
import { calculatePrayerTimes, formatTime, nextPrayer, PrayerTimes } from '../../lib/prayerTimes';
import { toHijri, formatHijri } from '../../lib/hijri';
import { hadithOfTheDay } from '../../data/hadith';
import quranData from '../../../assets/data/quran.json';

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ayahOfTheDay() {
  const now = new Date();
  const seed = Math.floor(now.getTime() / 86400000);
  const surahs = (quranData as any).surahs as any[];
  const s = surahs[Math.abs(seed) % surahs.length];
  const v = s.verses[Math.abs(seed >> 3) % s.verses.length];
  return { surah: s.n, ...v };
}

export default function Home() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc } = useLocation();

  const times: PrayerTimes | null = useMemo(() => {
    if (!loc) return null;
    return calculatePrayerTimes(new Date(), loc.lat, loc.lng, {
      methodId: settings.methodId,
      asrJuristic: settings.asrJuristic,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.adjustments,
      dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
    });
  }, [loc, settings]);

  const next = useMemo(() => (times ? nextPrayer(times, new Date()) : null), [times]);
  const countdown = useCountdown(next?.at ?? new Date());
  const hijri = toHijri(new Date(), settings.hijriAdjust);
  const hadith = useMemo(() => hadithOfTheDay(), []);
  const ayah = useMemo(() => ayahOfTheDay(), []);

  const quickLinks = [
    { label: t('tasbih', lang), icon: '📿', route: '/tasbih' },
    { label: t('duas', lang), icon: '🤲', route: '/duas' },
    { label: t('names99', lang), icon: '✨', route: '/names' },
    { label: t('tracker', lang), icon: '✅', route: '/tracker' },
    { label: t('mosques', lang), icon: '🕌', route: '/mosques' },
    { label: t('makkahLive', lang), icon: '🕋', route: '/makkah' },
  ];

  return (
    <Screen>
      <Scroller>
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.bismillah, { color: th.accent }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Sub style={{ textAlign: 'center', marginTop: 4 }}>
            {formatHijri(hijri, lang)} · {new Date().toLocaleDateString()}
          </Sub>
        </View>

        <Card>
          {times && next ? (
            <>
              <Sub>{t('nextPrayer', lang)} · {t(next.name, lang)}</Sub>
              <Text style={[styles.countdown, { color: th.text }]}>{countdown}</Text>
              <Text style={[styles.time, { color: th.accent }]}>
                {formatTime(times[next.name], settings.use24h)}
              </Text>
              {!loc ? null : (
                <Sub style={{ marginTop: 6 }}>📍 {loc.label}</Sub>
              )}
            </>
          ) : (
            <>
              <Title>🕌 Noor</Title>
              <Sub>Set your location to see prayer times.</Sub>
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: th.accent }]}
                onPress={() => router.push('/prayer')}
              >
                <Text style={styles.ctaText}>{t('prayer', lang)} →</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <Card>
          <Sub>{t('ayahOfDay', lang)} — {ayah.surah}:{ayah.n}</Sub>
          <Text style={[styles.arabic, { color: th.text }]}>{ayah.ar}</Text>
          <Sub style={{ marginTop: 8 }}>
            {lang === 'ur' ? ayah.ur : lang === 'hi' ? ayah.hi : ayah.en}
          </Sub>
        </Card>

        <Card>
          <Sub>{t('hadithOfDay', lang)}</Sub>
          <Text style={[styles.arabic, { color: th.text, fontSize: 18 }]}>{hadith.ar}</Text>
          <Sub style={{ marginTop: 8 }}>{hadith.en}</Sub>
          <Sub style={{ marginTop: 4, fontStyle: 'italic' }}>— {hadith.ref}</Sub>
        </Card>

        <View style={styles.grid}>
          {quickLinks.map(q => (
            <TouchableOpacity
              key={q.route}
              style={[styles.tile, { backgroundColor: th.card, borderColor: th.border }]}
              onPress={() => router.push(q.route as any)}
            >
              <Text style={{ fontSize: 26 }}>{q.icon}</Text>
              <Text style={{ color: th.text, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6 }}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bismillah: { fontSize: 22, textAlign: 'center', fontWeight: '700' },
  countdown: { fontSize: 44, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  time: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  arabic: { fontSize: 20, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  cta: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center' },
});
