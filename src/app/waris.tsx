import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';

// Simplified inheritance (Waris) calculator — common family case.
// Full Islamic inheritance law is complex; this covers the standard scenario
// and advises scholar consultation for special cases.

// Moved outside component — defining inside causes TextInput remount on every keystroke (keyboard dismiss bug).
function Field({ label, value, set, th }: { label: string; value: string; set: (v: string) => void; th: any }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Sub>{label}</Sub>
      <TextInput value={value} onChangeText={set} keyboardType="numeric" placeholder="0"
        style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
        placeholderTextColor={th.sub} />
    </View>
  );
}

export default function Waris() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [estate, setEstate] = useState('');
  const [deceased, setDeceased] = useState<'male' | 'female'>('male');
  const [sons, setSons] = useState('0');
  const [daughters, setDaughters] = useState('0');
  const [wife, setWife] = useState('1');
  const [husbandAlive, setHusbandAlive] = useState(false);
  const [father, setFather] = useState(false);
  const [mother, setMother] = useState(false);

  const E = parseFloat(estate) || 0;
  const nSons = parseInt(sons) || 0;
  const nDau = parseInt(daughters) || 0;
  const nWife = parseInt(wife) || 0;
  const hasChildren = nSons + nDau > 0;

  // fixed shares
  const shares: { who: string; frac: number }[] = [];
  if (deceased === 'male' && nWife > 0) shares.push({ who: `Wife (total)`, frac: hasChildren ? 1 / 8 : 1 / 4 });
  if (deceased === 'female' && husbandAlive) shares.push({ who: 'Husband', frac: hasChildren ? 1 / 4 : 1 / 2 });
  if (father) shares.push({ who: 'Father', frac: hasChildren ? 1 / 6 : 0 });
  if (mother) shares.push({ who: 'Mother', frac: hasChildren ? 1 / 6 : 1 / 3 });

  const fixedTotal = shares.reduce((a, s) => a + s.frac, 0);
  const remainder = Math.max(0, 1 - fixedTotal);

  // children share remainder: sons get twice daughters
  const parts = nSons * 2 + nDau;
  const childShares: { who: string; frac: number }[] = [];
  if (parts > 0) {
    for (let i = 0; i < nSons; i++) childShares.push({ who: `Son ${i + 1}`, frac: remainder * (2 / parts) });
    for (let i = 0; i < nDau; i++) childShares.push({ who: `Daughter ${i + 1}`, frac: remainder * (1 / parts) });
  }

  const all = [...shares, ...childShares];

  return (
    <Screen>
      <Scroller>
        <Title>⚖️ {t('waris', lang)}</Title>
        <Card>
          <Field label="Total estate value" value={estate} set={setEstate} th={th} />
          <Sub style={{ marginTop: 10 }}>Deceased:</Sub>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {(['male', 'female'] as const).map(g => (
              <Text key={g} onPress={() => setDeceased(g)}
                style={[styles.chip, { borderColor: th.border, color: th.text,
                  backgroundColor: deceased === g ? th.accentSoft : 'transparent' }]}>
                {g === 'male' ? 'Male' : 'Female'}
              </Text>
            ))}
          </View>
          <Field label="Sons" value={sons} set={setSons} th={th} />
          <Field label="Daughters" value={daughters} set={setDaughters} th={th} />
          {deceased === 'male'
            ? <Field label="Wives" value={wife} set={setWife} th={th} />
            : <Text onPress={() => setHusbandAlive(!husbandAlive)} style={{ color: th.accent, marginTop: 10, fontSize: 15 }}>
                {husbandAlive ? '✓' : '○'} Husband alive
              </Text>}
          <Text onPress={() => setFather(!father)} style={{ color: th.accent, marginTop: 10, fontSize: 15 }}>
            {father ? '✓' : '○'} Father alive
          </Text>
          <Text onPress={() => setMother(!mother)} style={{ color: th.accent, marginTop: 6, fontSize: 15 }}>
            {mother ? '✓' : '○'} Mother alive
          </Text>
        </Card>
        {E > 0 ? (
          <Card>
            {all.map((s, i) => (
              <View key={i} style={[styles.row, { borderBottomColor: th.border }]}>
                <Text style={{ color: th.text, fontSize: 15 }}>{s.who}</Text>
                <Text style={{ color: th.accent, fontSize: 15, fontWeight: '700' }}>
                  {Math.round(E * s.frac).toLocaleString()}
                </Text>
              </View>
            ))}
            {all.length === 0 ? <Sub>No heirs entered.</Sub> : null}
          </Card>
        ) : null}
        <Sub>Simplified for the common case. Complex situations (grandparents, siblings, etc.) need a scholar.</Sub>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, fontSize: 15 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
});
