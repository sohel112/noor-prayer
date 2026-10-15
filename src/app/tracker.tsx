import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { getJSON, setJSON, todayKey } from '../lib/storage';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Last N days, newest first. */
function lastDays(n: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Tracker() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [log, setLog] = useState<Record<string, Record<string, boolean>>>({});
  const [qada, setQada] = useState<Record<string, number>>({});
  const [uzr, setUzr] = useState<Record<string, boolean>>({});
  const [today, setToday] = useState('');
  const [selected, setSelected] = useState(''); // YYYY-MM-DD being edited

  useEffect(() => {
    (async () => {
      const tk = await todayKey();
      setToday(tk);
      setSelected(tk);
      setLog(await getJSON('prayerLog', {}));
      setQada(await getJSON('qada', {}));
      setUzr(await getJSON('uzrDays', {}));
    })();
  }, []);

  const days = useMemo(() => lastDays(14), []);

  const toggle = async (p: string) => {
    const next = { ...log, [selected]: { ...(log[selected] ?? {}), [p]: !(log[selected]?.[p]) } };
    setLog(next);
    await setJSON('prayerLog', next);
  };

  const toggleUzr = async () => {
    const next = { ...uzr };
    if (next[selected]) delete next[selected];
    else next[selected] = true;
    setUzr(next);
    await setJSON('uzrDays', next);
  };

  const bumpQada = async (p: string, d: number) => {
    const next = { ...qada, [p]: Math.max(0, (qada[p] ?? 0) + d) };
    setQada(next);
    await setJSON('qada', next);
  };

  // Streak: consecutive days where all 5 prayed OR day marked uzr.
  // Uzr days neither break the streak nor require prayers.
  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = keyOf(d);
      if (uzr[k]) { d.setDate(d.getDate() - 1); continue; }
      const day = log[k];
      if (day && PRAYERS.every(p => day[p])) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  }, [log, uzr]);

  const isUzrDay = !!uzr[selected];
  const doneSelected = PRAYERS.filter(p => log[selected]?.[p]).length;
  const isToday = selected === today;

  const dayStatus = (k: string): 'done' | 'partial' | 'uzr' | 'none' => {
    if (uzr[k]) return 'uzr';
    const day = log[k];
    if (!day) return 'none';
    const n = PRAYERS.filter(p => day[p]).length;
    return n === 5 ? 'done' : n > 0 ? 'partial' : 'none';
  };

  return (
    <Screen>
      <Scroller>
        <Title>✅ {t('tracker', lang)}</Title>

        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          {/* Progress ring */}
          <View style={[styles.ring, { borderColor: th.border }]}>
            <View style={[
              styles.ringFill,
              {
                borderColor: th.gold,
                borderTopColor: doneSelected > 0 ? th.gold : 'transparent',
                borderRightColor: doneSelected >= 2 ? th.gold : 'transparent',
                borderBottomColor: doneSelected >= 4 ? th.gold : 'transparent',
                borderLeftColor: doneSelected >= 5 ? th.gold : 'transparent',
              },
            ]} />
            <View style={styles.ringInner}>
              <Text style={[styles.big, { color: th.text }]}>{doneSelected}/5</Text>
            </View>
          </View>
          <Sub style={{ marginTop: 12, fontWeight: '700', color: th.text }}>
            {t('dailyProgress', lang)}
          </Sub>
          <Sub>{isToday ? t('today', lang) : selected} · 🔥 {streak} {t('streak', lang)}</Sub>
          {!isToday && !isUzrDay && doneSelected < 5 ? (
            <Text style={{ color: '#ff6b6b', fontWeight: '700', marginTop: 4, fontSize: 14 }}>
              ❌ {5 - doneSelected} missed
            </Text>
          ) : null}
        </Card>

        {/* Day selector — tap any of the last 14 days to edit it */}
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 8 }}>
            {isUzrDay ? '🌸 Uzr day — excused' : 'Tap a day to view / edit'}
          </Sub>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {days.map(d => {
              const k = keyOf(d);
              const st = dayStatus(k);
              const active = k === selected;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setSelected(k)}
                  style={[
                    styles.dayChip,
                    {
                      borderColor: active ? th.accent : th.border,
                      backgroundColor: active ? th.accentSoft : 'transparent',
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayName, { color: th.sub }]}>{DAY_NAMES[d.getDay()]}</Text>
                  <Text style={[styles.dayNum, { color: th.text }]}>{d.getDate()}</Text>
                  <Text style={styles.dayDot}>
                    {st === 'done' ? '✅' : st === 'partial' ? '◐' : st === 'uzr' ? '🌸' : '·'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Sub style={{ marginTop: 6, fontSize: 12 }}>
            ✅ all prayed · ◐ partial · 🌸 uzr (excused)
          </Sub>
        </Card>

        {/* Prayers for selected day */}
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 8 }}>
            {isToday ? "Today's prayers" : `Prayers — ${selected}`}
          </Sub>
          {isUzrDay ? (
            <Sub style={{ marginBottom: 8 }}>
              This day is marked as uzr (excused). Prayers are not counted as missed,
              and your streak is protected.
            </Sub>
          ) : null}
          {PRAYERS.map(p => {
            const done = log[selected]?.[p];
            // Past days: unprayed = explicitly MISSED. Today: still time, show as pending.
            const missed = !done && !isToday && !isUzrDay;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => toggle(p)}
                disabled={isUzrDay}
                style={[styles.row, { borderBottomColor: th.border, opacity: isUzrDay ? 0.4 : 1 }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: th.text, fontSize: 16 }}>{t(p, lang)}</Text>
                  {missed ? (
                    <Text style={[styles.missedBadge, { color: '#ff6b6b', borderColor: '#ff6b6b' }]}>
                      MISSED
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 22 }}>{done ? '✅' : missed ? '❌' : '⬜'}</Text>
              </TouchableOpacity>
            );
          })}
          {/* Uzr toggle — neutral language, no shaming */}
          <TouchableOpacity
            onPress={toggleUzr}
            style={[
              styles.uzrBtn,
              { borderColor: th.accent, backgroundColor: isUzrDay ? th.accentSoft : 'transparent' },
            ]}
          >
            <Text style={{ color: th.accent, fontWeight: '700', fontSize: 15 }}>
              {isUzrDay ? '🌸 Uzr marked — tap to unmark' : '🌸 Mark as uzr (excused day)'}
            </Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 4 }}>Qada — missed prayers to make up</Sub>
          <Sub>Count prayers you missed (e.g. during travel) and clear them as you pray them.</Sub>
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
  big: { fontSize: 40, fontWeight: '800' },
  ring: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ringFill: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 10,
  },
  ringInner: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  dayChip: {
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
    marginHorizontal: 4, alignItems: 'center', minWidth: 52,
  },
  dayName: { fontSize: 11, fontWeight: '600' },
  dayNum: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  dayDot: { fontSize: 13, marginTop: 2 },
  uzrBtn: {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  missedBadge: {
    fontSize: 10, fontWeight: '800', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
});
