import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, Arabic, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { MORNING_ADHKAR, EVENING_ADHKAR, Dhikr } from '../data/adhkar';

function DhikrList({ items }: { items: Dhikr[] }) {
  const th = useTheme();
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <>
      {items.map(d => (
        <TouchableOpacity key={d.id} onPress={() => setDone(p => ({ ...p, [d.id]: !p[d.id] }))}>
          <Card style={{ opacity: done[d.id] ? 0.55 : 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18 }}>{done[d.id] ? '✅' : '⬜'}</Text>
              <Text style={{ color: th.accent, fontWeight: '700' }}>{d.count}×</Text>
            </View>
            <Arabic size={20}>{d.ar}</Arabic>
            <Sub style={{ marginTop: 6 }}>{d.en}</Sub>
            {d.ref ? <Sub style={{ fontStyle: 'italic' }}>{d.ref}</Sub> : null}
          </Card>
        </TouchableOpacity>
      ))}
    </>
  );
}

export default function Adhkar() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [tab, setTab] = useState<'morning' | 'evening'>('morning');

  return (
    <Screen>
      <Scroller>
        <Title>🌅 {t('adhkar', lang)}</Title>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['morning', 'evening'] as const).map(x => (
            <TouchableOpacity key={x} onPress={() => setTab(x)}
              style={[styles.tab, { borderColor: th.border, backgroundColor: tab === x ? th.accent : th.card }]}>
              <Text style={{ color: tab === x ? '#fff' : th.text, fontWeight: '700' }}>
                {x === 'morning' ? '☀️ Morning' : '🌙 Evening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <DhikrList items={tab === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR} />
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
});
