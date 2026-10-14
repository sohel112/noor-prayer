import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { toHijri, formatHijri, HIJRI_OCCASIONS } from '../lib/hijri';

export default function Calendar() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const now = new Date();
  const hijri = useMemo(() => toHijri(now, settings.hijriAdjust), [settings.hijriAdjust]);

  const upcoming = useMemo(() => {
    // next occurrence of each occasion (this or next Hijri year — simplified: show all)
    return HIJRI_OCCASIONS.map(o => {
      const isToday = o.month === hijri.month && o.day === hijri.day;
      const isPast = o.month < hijri.month || (o.month === hijri.month && o.day < hijri.day);
      return { ...o, isToday, isPast };
    }).sort((a, b) => (a.isPast ? 1 : 0) - (b.isPast ? 1 : 0) || a.month - b.month || a.day - b.day);
  }, [hijri]);

  return (
    <Screen>
      <Scroller>
        <Title>📅 {t('calendar', lang)}</Title>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={[styles.big, { color: th.text }]}>{hijri.day}</Text>
          <Text style={{ color: th.accent, fontSize: 20, fontWeight: '700' }}>
            {formatHijri(hijri, lang)}
          </Text>
          <Sub style={{ marginTop: 6 }}>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Sub>
          {settings.hijriAdjust !== 0 ? <Sub>Moon-sighting adjustment: {settings.hijriAdjust > 0 ? '+' : ''}{settings.hijriAdjust} day(s)</Sub> : null}
        </Card>
        <Sub style={{ fontWeight: '700', color: th.text, fontSize: 16 }}>Islamic occasions</Sub>
        {upcoming.map((o, i) => (
          <Card key={i} style={{ opacity: o.isPast ? 0.5 : 1, borderColor: o.isToday ? th.accent : th.border, borderWidth: o.isToday ? 2 : 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: th.text, fontSize: 16, fontWeight: '700' }}>
                  {lang === 'ur' ? o.nameUr : o.nameEn}
                </Text>
                <Sub>{o.day} {o.month === 1 ? 'Muharram' : o.month === 9 ? 'Ramadan' : o.month === 10 ? 'Shawwal' : o.month === 12 ? "Dhu al-Hijjah" : `month ${o.month}`}</Sub>
              </View>
              {o.isToday ? <Text style={{ color: th.accent, fontWeight: '800' }}>TODAY</Text> : null}
            </View>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 64, fontWeight: '800' },
});
