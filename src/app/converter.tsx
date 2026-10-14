import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { toHijri, formatHijri } from '../lib/hijri';

export default function Converter() {
  const { settings, update } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [d, setD] = useState('14');
  const [m, setM] = useState('10');
  const [y, setY] = useState('2026');

  const hijri = (() => {
    const dd = parseInt(d) || 1, mm = parseInt(m) || 1, yy = parseInt(y) || 2000;
    return toHijri(new Date(yy, mm - 1, dd), settings.hijriAdjust);
  })();

  return (
    <Screen>
      <Scroller>
        <Title>🔄 {t('converter', lang)}</Title>
        <Card>
          <Sub>Gregorian date → Hijri</Sub>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[
              { v: d, s: setD, ph: 'Day' },
              { v: m, s: setM, ph: 'Month' },
              { v: y, s: setY, ph: 'Year' },
            ].map((f, i) => (
              <TextInput key={i} placeholder={f.ph} value={f.v} onChangeText={f.s} keyboardType="numeric"
                style={[styles.input, { flex: 1, color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
                placeholderTextColor={th.sub} />
            ))}
          </View>
          <Text style={[styles.result, { color: th.accent }]}>{formatHijri(hijri, lang)}</Text>
        </Card>
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>Moon-sighting adjustment</Sub>
          <Sub>If the new moon was sighted a day earlier/later in your area, adjust:</Sub>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[-2, -1, 0, 1, 2].map(v => (
              <TouchableOpacity key={v} onPress={() => update({ hijriAdjust: v })}
                style={[styles.adj, { borderColor: th.border, backgroundColor: settings.hijriAdjust === v ? th.accent : th.card }]}>
                <Text style={{ color: settings.hijriAdjust === v ? '#fff' : th.text, fontWeight: '700' }}>
                  {v > 0 ? `+${v}` : `${v}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15 },
  result: { fontSize: 26, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  adj: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
});
