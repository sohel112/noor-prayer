import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';

// Zakat: 2.5% on wealth above nisab held for a lunar year.
// Nisab = value of 85g gold OR 612.36g silver (user picks; silver = more cautious).

export default function Zakat() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [invest, setInvest] = useState('');
  const [debts, setDebts] = useState('');
  const [goldRate, setGoldRate] = useState('9500'); // per gram, editable
  const [silverRate, setSilverRate] = useState('110');
  const [useSilverNisab, setUseSilverNisab] = useState(true);

  const num = (s: string) => parseFloat(s) || 0;
  const total = num(cash) + num(gold) + num(silver) + num(invest) - num(debts);
  const nisab = useSilverNisab ? 612.36 * num(silverRate) : 85 * num(goldRate);
  const due = total >= nisab && total > 0 ? total * 0.025 : 0;

  const Field = ({ label, value, set }: { label: string; value: string; set: (v: string) => void }) => (
    <View style={{ marginTop: 8 }}>
      <Sub>{label}</Sub>
      <TextInput value={value} onChangeText={set} keyboardType="numeric" placeholder="0"
        style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
        placeholderTextColor={th.sub} />
    </View>
  );

  return (
    <Screen>
      <Scroller>
        <Title>💰 {t('zakat', lang)}</Title>
        <Card>
          <Field label="Cash in hand & bank" value={cash} set={setCash} />
          <Field label="Gold value" value={gold} set={setGold} />
          <Field label="Silver value" value={silver} set={setSilver} />
          <Field label="Investments / trade goods" value={invest} set={setInvest} />
          <Field label="Debts owed (subtract)" value={debts} set={setDebts} />
        </Card>
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>Nisab rates (per gram, editable)</Sub>
          <Field label="Gold rate/g" value={goldRate} set={setGoldRate} />
          <Field label="Silver rate/g" value={silverRate} set={setSilverRate} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {[{ l: 'Silver nisab', v: true }, { l: 'Gold nisab', v: false }].map(o => (
              <Text key={o.l} onPress={() => setUseSilverNisab(o.v)}
                style={[styles.chip, { borderColor: th.border, color: th.text,
                  backgroundColor: useSilverNisab === o.v ? th.accentSoft : 'transparent' }]}>
                {o.l}
              </Text>
            ))}
          </View>
        </Card>
        <Card style={{ alignItems: 'center', borderColor: th.accent, borderWidth: 2 }}>
          <Sub>Net zakatable wealth</Sub>
          <Text style={[styles.big, { color: th.text }]}>{Math.max(0, total).toLocaleString()}</Text>
          <Sub>Nisab threshold: {Math.round(nisab).toLocaleString()}</Sub>
          <Sub style={{ marginTop: 8 }}>Zakat due (2.5%)</Sub>
          <Text style={[styles.big, { color: th.accent }]}>{Math.round(due).toLocaleString()}</Text>
          {total < nisab ? <Sub style={{ marginTop: 6 }}>Below nisab — no zakat due.</Sub> : null}
        </Card>
        <Sub>Simplified calculator for guidance. For complex cases (business, agriculture), consult a scholar.</Sub>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, fontSize: 15 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden' },
  big: { fontSize: 32, fontWeight: '800', marginTop: 4 },
});
