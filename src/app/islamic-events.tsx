// Deen — Islamic Events Calendar
// Key Islamic dates (Ramadan, Eid, Ashura, Shab-e-Qadr, etc.) with countdown.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

interface IslamicEvent {
  name: string;
  hijri: string;
  gregorian: string; // YYYY-MM-DD (approximate, moon-sighting dependent)
  desc: string;
  icon: string;
}

// Dates are approximate — actual dates depend on moon sighting.
const EVENTS: IslamicEvent[] = [
  { name: "Isra & Mi'raj", hijri: '27 Rajab 1447', gregorian: '2026-01-16', desc: 'The Night Journey of the Prophet ﷺ', icon: '🌌' },
  { name: 'Shab-e-Barat', hijri: "15 Sha'ban 1447", gregorian: '2026-02-03', desc: 'Night of forgiveness & blessings', icon: '🌙' },
  { name: 'Ramadan Begins', hijri: '1 Ramadan 1447', gregorian: '2026-02-18', desc: 'The blessed month of fasting starts', icon: '🕌' },
  { name: 'Shab-e-Qadr', hijri: '27 Ramadan 1447', gregorian: '2026-03-16', desc: 'Better than a thousand months (odd nights)', icon: '✨' },
  { name: 'Eid-ul-Fitr', hijri: '1 Shawwal 1447', gregorian: '2026-03-20', desc: 'Festival of breaking the fast', icon: '🎉' },
  { name: 'Hajj Begins', hijri: '8 Dhul Hijjah 1447', gregorian: '2026-05-25', desc: 'Pilgrims head to Mina', icon: '🕋' },
  { name: 'Day of Arafah', hijri: '9 Dhul Hijjah 1447', gregorian: '2026-05-27', desc: 'Fast expiates sins of 2 years', icon: '🤲' },
  { name: 'Eid-ul-Adha', hijri: '10 Dhul Hijjah 1447', gregorian: '2026-05-28', desc: 'Festival of Sacrifice', icon: '🐑' },
  { name: 'Islamic New Year', hijri: '1 Muharram 1448', gregorian: '2026-06-16', desc: 'Start of Hijri year 1448', icon: '📅' },
  { name: 'Ashura', hijri: '10 Muharram 1448', gregorian: '2026-06-25', desc: 'Fast of Musa (AS) — with 9th or 11th', icon: '📿' },
  { name: 'Mawlid an-Nabi', hijri: "12 Rabi' al-Awwal 1448", gregorian: '2026-08-25', desc: 'Birth of the Prophet ﷺ', icon: '💚' },
  { name: 'Ramadan Begins', hijri: '1 Ramadan 1448', gregorian: '2027-02-07', desc: 'The blessed month of fasting starts', icon: '🕌' },
  { name: 'Eid-ul-Fitr', hijri: '1 Shawwal 1448', gregorian: '2027-03-10', desc: 'Festival of breaking the fast', icon: '🎉' },
  { name: 'Eid-ul-Adha', hijri: '10 Dhul Hijjah 1448', gregorian: '2027-05-17', desc: 'Festival of Sacrifice', icon: '🐑' },
];

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function daysUntil(s: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(s).getTime() - today.getTime()) / 86400000);
}

function formatGregorian(s: string): string {
  return parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function IslamicEvents() {
  const th = useTheme();

  const { nextEvent, countdown } = useMemo(() => {
    const upcoming = EVENTS.filter(e => daysUntil(e.gregorian) >= 0).sort(
      (a, b) => daysUntil(a.gregorian) - daysUntil(b.gregorian),
    );
    const next = upcoming[0] ?? null;
    return { nextEvent: next, countdown: next ? daysUntil(next.gregorian) : 0 };
  }, []);

  return (
    <Screen edges={['top']}>
      <TopBar title="📅 Islamic Events" onBack={() => router.back()} />
      <Scroller>
        {nextEvent && (
          <Card style={[styles.heroCard, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
            <Sub>Next Event</Sub>
            <Text style={styles.heroIcon}>{nextEvent.icon}</Text>
            <Title style={{ textAlign: 'center' }}>{nextEvent.name}</Title>
            <Text style={[styles.countdown, { color: th.primary }]}>
              {countdown === 0 ? 'Today! 🎉' : `in ${countdown} day${countdown === 1 ? '' : 's'}`}
            </Text>
            <Sub style={{ textAlign: 'center' }}>
              {nextEvent.hijri} • {formatGregorian(nextEvent.gregorian)}
            </Sub>
          </Card>
        )}

        <SectionTitle>All Events</SectionTitle>
        {EVENTS.map((e, i) => {
          const d = daysUntil(e.gregorian);
          const isPast = d < 0;
          return (
            <Card
              key={`${e.name}-${e.gregorian}`}
              style={[styles.eventCard, { borderColor: th.border, opacity: isPast ? 0.55 : 1 }]}
            >
              <Text style={styles.eventIcon}>{e.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventName, { color: th.text }]}>{e.name}</Text>
                <Sub>{e.hijri}</Sub>
                <Sub>{e.desc}</Sub>
              </View>
              <View style={styles.dateCol}>
                <Text style={[styles.dateText, { color: th.primary }]}>
                  {formatGregorian(e.gregorian)}
                </Text>
                <Sub style={{ textAlign: 'right' }}>
                  {d === 0 ? 'Today' : d > 0 ? `${d}d left` : 'Passed'}
                </Sub>
              </View>
            </Card>
          );
        })}

        <Card style={{ marginTop: 8 }}>
          <Sub style={{ textAlign: 'center', fontStyle: 'italic' }}>
            Dates are approximate — actual dates depend on moon sighting in your region. 🌙
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderWidth: 1, padding: 20, alignItems: 'center' },
  heroIcon: { fontSize: 44, marginVertical: 6 },
  countdown: { fontSize: 22, fontFamily: FONTS.bodyBold, marginVertical: 4 },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, marginBottom: 10, padding: 12,
  },
  eventIcon: { fontSize: 28 },
  eventName: { fontSize: 15, fontFamily: FONTS.bodyBold },
  dateCol: { alignItems: 'flex-end' },
  dateText: { fontSize: 12, fontFamily: FONTS.bodySemi },
});
