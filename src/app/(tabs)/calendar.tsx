import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Screen, Scroller, Card, Sub, useTheme, TopBar, SectionTitle, Heading,
} from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { toHijri, formatHijri, hijriMonthName, HIJRI_OCCASIONS, type HijriOccasion } from '../../lib/hijri';
import { FONTS } from '../../lib/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventHit { occasion: HijriOccasion; date: Date; }

/** Find the next occurrences of each Hijri occasion within ~13 months. */
function upcomingEvents(from: Date, adjust: number, max = 4): EventHit[] {
  const hits: EventHit[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= 400 && hits.length < max * 2; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const h = toHijri(d, adjust);
    for (const o of HIJRI_OCCASIONS) {
      const key = `${o.month}-${o.day}`;
      if (o.month === h.month && o.day === h.day && !seen.has(key)) {
        seen.add(key);
        hits.push({ occasion: o, date: d });
      }
    }
  }
  return hits.slice(0, max);
}

function daysUntilLabel(from: Date, to: Date): string {
  const days = Math.round((to.getTime() - from.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `In ${days} days`;
  const months = Math.round(days / 30.44);
  return months <= 1 ? 'In a month' : `In ${months} months`;
}

function fmtGreg(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function IslamicCalendar() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const adjust = settings.hijriAdjust ?? 0;

  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Date>(today);

  const grid = useMemo(() => {
    const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const startDow = new Date(y, m, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const headerHijri = toHijri(new Date(y, m, 1), adjust);
    const cells: { greg: Date; hijriDay: number; isToday: boolean; isSelected: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const greg = new Date(y, m, d);
      const hijriDay = toHijri(greg, adjust).day;
      cells.push({
        greg,
        hijriDay,
        isToday: greg.toDateString() === today.toDateString(),
        isSelected: greg.toDateString() === selected.toDateString(),
      });
    }
    return { y, m, startDow, cells, headerHijri };
  }, [today, monthOffset, selected, adjust]);

  const events = useMemo(() => upcomingEvents(today, adjust), [today, adjust]);
  const selectedHijri = useMemo(() => toHijri(selected, adjust), [selected, adjust]);

  return (
    <Screen edges={['top']}>
      <TopBar title={t('calendar', lang)} />
      <Scroller>
        {/* Month header */}
        <Card style={styles.monthHead}>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => o - 1)}
            activeOpacity={0.7}
            style={[styles.chevBtn, { backgroundColor: th.chip }]}
          >
            <Text style={{ color: th.text, fontSize: 22, fontFamily: FONTS.body }}>‹</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Heading size={21} style={{ marginBottom: 0 }}>
              {hijriMonthName(grid.headerHijri.month, lang)} {grid.headerHijri.year}
            </Heading>
            <Sub>{new Date(grid.y, grid.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Sub>
          </View>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => o + 1)}
            activeOpacity={0.7}
            style={[styles.chevBtn, { backgroundColor: th.chip }]}
          >
            <Text style={{ color: th.text, fontSize: 22, fontFamily: FONTS.body }}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Day grid */}
        <Card>
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => (
              <Text key={w} style={[styles.weekDay, { color: th.sub }]}>{w}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {Array.from({ length: grid.startDow }).map((_, i) => (
              <View key={`b${i}`} style={styles.cell} />
            ))}
            {grid.cells.map(c => (
              <TouchableOpacity
                key={c.greg.getDate()}
                onPress={() => setSelected(c.greg)}
                activeOpacity={0.75}
                style={styles.cell}
              >
                <View style={[
                  styles.dayInner,
                  c.isSelected && { backgroundColor: th.primary, borderRadius: 14 },
                  !c.isSelected && c.isToday && { borderColor: th.primary, borderWidth: 1.5, borderRadius: 14 },
                ]}>
                  <Text style={{
                    color: c.isSelected ? th.onPrimary : th.text,
                    fontSize: 16,
                    fontFamily: c.isToday || c.isSelected ? FONTS.bodyBold : FONTS.body,
                  }}>
                    {c.greg.getDate()}
                  </Text>
                  <Text style={{
                    color: c.isSelected ? th.onPrimary : th.sub,
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    opacity: c.isSelected ? 0.9 : 0.75,
                  }}>
                    {c.hijriDay}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <Sub style={{ marginTop: 10, textAlign: 'center' }}>
            Small number = Hijri day · tap a date to select
          </Sub>
        </Card>

        {/* Selected date card */}
        <View style={[styles.selectedCard, { backgroundColor: th.primaryDark }]}>
          <Text style={{ color: th.accent, fontSize: 13, fontFamily: FONTS.bodySemi, letterSpacing: 2 }}>
            SELECTED DATE
          </Text>
          <Heading size={26} style={{ color: '#FFFFFF', marginBottom: 0 }}>
            {formatHijri(selectedHijri, 'en')}
          </Heading>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontFamily: FONTS.body }}>
            {fmtGreg(selected)}
          </Text>
        </View>

        {/* Upcoming events */}
        <SectionTitle>Upcoming Events</SectionTitle>
        <Card style={{ padding: 8 }}>
          {events.length ? events.map(({ occasion, date }) => (
            <View
              key={`${occasion.month}-${occasion.day}`}
              style={[styles.eventRow, { borderBottomColor: th.border }]}
            >
              <View style={[styles.eventIcon, { backgroundColor: th.chip }]}>
                <Text style={{ fontSize: 18 }}>🌙</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 15, fontFamily: FONTS.bodyMedium }}>
                  {settings.translation === 'ur' || lang === 'ur' ? occasion.nameUr : occasion.nameEn}
                </Text>
                <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body, marginTop: 2 }}>
                  {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{daysUntilLabel(today, date)}
                </Text>
              </View>
              <Text style={{ color: th.sub, fontSize: 22, fontFamily: FONTS.body }}>›</Text>
            </View>
          )) : (
            <Sub style={{ padding: 12 }}>No upcoming events found.</Sub>
          )}
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  chevBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: {
    flex: 1, textAlign: 'center', fontSize: 12,
    fontFamily: FONTS.bodySemi,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 0.95, padding: 2 },
  dayInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  selectedCard: {
    borderRadius: 18, padding: 20, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 3,
  },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  eventIcon: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
});
