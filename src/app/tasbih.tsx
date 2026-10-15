import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, TextInput } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { getJSON, setJSON } from '../lib/storage';
import { AFTER_PRAYER_DHIKR } from '../data/adhkar';

const PRESETS = [
  { ar: 'سُبْحَانَ اللَّهِ', en: 'SubhanAllah', target: 33 },
  { ar: 'الْحَمْدُ لِلَّهِ', en: 'Alhamdulillah', target: 33 },
  { ar: 'اللَّهُ أَكْبَرُ', en: 'Allahu Akbar', target: 34 },
  { ar: 'أَسْتَغْفِرُ اللَّهَ', en: 'Astaghfirullah', target: 100 },
  { ar: 'لَا إِلَهَ إِلَّا اللَّهُ', en: 'La ilaha illallah', target: 100 },
];

export default function Tasbih() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [phrase, setPhrase] = useState(PRESETS[0]);
  const [total, setTotal] = useState(0);
  const [customTarget, setCustomTarget] = useState('');

  useEffect(() => {
    getJSON<{ total: number }>('tasbih', { total: 0 }).then(v => setTotal(v.total));
  }, []);

  const tap = () => {
    const next = count + 1;
    setCount(next);
    if (next % 33 === 0) Vibration.vibrate(40);
    else Vibration.vibrate(10);
    const nt = total + 1;
    setTotal(nt);
    setJSON('tasbih', { total: nt });
  };

  const reset = () => setCount(0);
  const progress = target > 0 ? Math.min(1, count / target) : 0;

  return (
    <Screen>
      <Scroller>
        <Title>📿 {t('tasbih', lang)}</Title>

        <View style={styles.presets}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.en}
              onPress={() => { setPhrase(p); setTarget(p.target); setCount(0); }}
              style={[styles.chip, { borderColor: th.border, backgroundColor: phrase.en === p.en ? th.accentSoft : th.card }]}
            >
              <Text style={{ color: th.text, fontSize: 13, fontWeight: '600' }}>{p.en}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={[styles.phraseAr, { color: th.text }]}>{phrase.ar}</Text>
          <Text style={[styles.phraseEn, { color: th.sub }]}>{phrase.en}</Text>
          <View style={[styles.ring, { borderColor: th.border }]}>
            <View style={[styles.ringFill, { borderColor: th.accent, transform: [{ rotate: `${-90 + progress * 360}deg` }] }]} />
            <Text style={[styles.count, { color: th.text }]}>{count}</Text>
          </View>
          <Sub>{t('tapToCount', lang)} · target {target}</Sub>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: th.accent }]} onPress={tap} activeOpacity={0.7}>
            <Text style={[styles.bigBtnText, { color: th.onAccent }]}>تسبیح</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity onPress={reset} style={[styles.smallBtn, { borderColor: th.border }]}>
              <Text style={{ color: th.text }}>{t('reset', lang)}</Text>
            </TouchableOpacity>
            <View style={[styles.smallBtn, { borderColor: th.border, flexDirection: 'row', alignItems: 'center' }]}>
              <TextInput
                placeholder="Target" value={customTarget} onChangeText={setCustomTarget}
                keyboardType="numeric" style={{ color: th.text, width: 60, textAlign: 'center' }}
                placeholderTextColor={th.sub}
              />
              <TouchableOpacity onPress={() => { const v = parseInt(customTarget, 10); if (v > 0) setTarget(v); }}>
                <Text style={{ color: th.accent, fontWeight: '700' }}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Sub style={{ marginTop: 10 }}>Lifetime total: {total.toLocaleString()}</Sub>
        </Card>

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text, marginBottom: 8 }}>After-prayer dhikr</Sub>
          {AFTER_PRAYER_DHIKR.map(d => (
            <View key={d.id} style={[styles.dhikrRow, { borderBottomColor: th.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 15 }}>{d.en}</Text>
                <Sub>{d.ref ?? ''}</Sub>
              </View>
              <Text style={{ color: th.accent, fontWeight: '700' }}>{d.count}×</Text>
            </View>
          ))}
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  phraseAr: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  phraseEn: { fontSize: 15, marginTop: 4 },
  ring: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center', marginVertical: 16, position: 'relative',
  },
  ringFill: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    borderWidth: 8, borderLeftColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  count: { fontSize: 40, fontWeight: '800' },
  bigBtn: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bigBtnText: { fontSize: 26, fontWeight: '700' },
  smallBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  dhikrRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
});
