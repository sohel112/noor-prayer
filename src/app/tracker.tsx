import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { getJSON, setJSON, todayKey } from '../lib/storage';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export default function Tracker() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [log, setLog] = useState<Record<string, Record<string, boolean>>>({});
  const [qada, setQada] = useState<Record<string, number>>({});
  const [today, setToday] = useState('');

  useEffect(() => {
    (async () => {
      setToday(await todayKey());
      setLog(await getJSON('prayerLog', {}));
      setQada(await getJSON('qada', {}));
    })();
  }, []);

  const toggle = async (p: string) => {
    const next = { ...log, [today]: { ...(log[today] ?? {}), [p]: !(log[today]?.[p]) } };
    setLog(next);
    await setJSON('prayerLog', next);
  };

  const bumpQada = async (p: string, d: number) => {
    const next = { ...qada, [p]: Math.max(0, (qada[p] ?? 0) + d) };
    setQada(next);
    await setJSON('qada', next);
  };

  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const day = log[k];
      if (day && PRAYERS.every(p => day[p])) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  }, [log]);

  const doneToday = PRAYERS.filter(p => log[today]?.[p]).length;

  return (
    <Screen>
      <Scroller>
        <Title>✅ {t('tracker', lang)}</Title>
        <Card style={{ alignItems: 'center' }}>
          <Text style={[styles.big, { color: th.text }]}>{doneToday}/5</Text>
          <Sub>today · 🔥 {streak} {t('streak', lang)}</Sub>
        </Card>
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 8 }}>Today's prayers</Sub>
          {PRAYERS.map(p => (
            <TouchableOpacity key={p} onPress={() => toggle(p)} style={[styles.row, { borderBottomColor: th.border }]}>
              <Text style={{ color: th.text, fontSize: 16 }}>{t(p, lang)}</Text>
              <Text style={{ fontSize: 22 }}>{log[today]?.[p] ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
          ))}
        </Card>
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 4 }}>Qada — missed prayers to make up</Sub>
          <Sub>Count prayers you missed (e.g. during travel or Ramadan) and clear them as you pray them.</Sub>
          {PRAYERS.map(p => (
            <View key={p} style={[styles.row, { borderBottomColor: th.border }]}>
              <Text style={{ color: th.text, fontSize: 16 }}>{t(p, lang)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => bumpQada(p, -1)}>
                  <Text style={{ color: th.accent, fontSize: 22, fontWeight: '700' }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: th.text, fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' }}>
                  {qada[p] ?? 0}
                </Text>
                <TouchableOpacity onPress={() => bumpQada(p, 1)}>
                  <Text style={{ color: th.accent, fontSize: 22, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 48, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
});
