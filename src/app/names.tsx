import React, { useMemo, useState } from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { NAMES_99 } from '../data/names99';

export default function Names() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return NAMES_99;
    return NAMES_99.filter(n => n.tr.toLowerCase().includes(query) || n.en.toLowerCase().includes(query));
  }, [q]);

  return (
    <Screen>
      <Scroller>
        <Title>✨ {t('names99', lang)}</Title>
        <TextInput placeholder={t('search', lang)} value={q} onChangeText={setQ}
          style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.card }]}
          placeholderTextColor={th.sub} />
        {list.map(n => (
          <Card key={n.n} style={styles.row}>
            <View style={[styles.num, { backgroundColor: th.accentSoft }]}>
              <Text style={{ color: th.accent, fontWeight: '700' }}>{n.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: th.text, fontSize: 16, fontWeight: '700' }}>{n.tr}</Text>
              <Sub>{n.en}</Sub>
            </View>
            <Text style={{ color: th.text, fontSize: 24 }}>{n.ar}</Text>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
