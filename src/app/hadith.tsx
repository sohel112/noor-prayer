import React, { useMemo, useState } from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, Arabic, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { HADITHS, hadithOfTheDay } from '../data/hadith';

export default function Hadith() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [q, setQ] = useState('');
  const today = useMemo(() => hadithOfTheDay(), []);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return HADITHS;
    return HADITHS.filter(h => h.en.toLowerCase().includes(query) || h.topic.toLowerCase().includes(query));
  }, [q]);

  return (
    <Screen>
      <Scroller>
        <Title>📜 {t('hadith', lang)}</Title>
        <Card style={{ borderColor: th.accent, borderWidth: 2 }}>
          <Sub style={{ fontWeight: '700', color: th.accent }}>{t('hadithOfDay', lang)} · {today.topic}</Sub>
          <Arabic size={20}>{today.ar}</Arabic>
          <Sub style={{ marginTop: 8 }}>{today.en}</Sub>
          <Sub style={{ fontStyle: 'italic' }}>— {today.ref}</Sub>
        </Card>
        <TextInput placeholder={t('search', lang)} value={q} onChangeText={setQ}
          style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.card }]}
          placeholderTextColor={th.sub} />
        {list.map(h => (
          <Card key={h.id}>
            <Sub style={{ fontWeight: '700', color: th.accent }}>{h.topic} · {h.ref}</Sub>
            <Arabic size={19}>{h.ar}</Arabic>
            <Sub style={{ marginTop: 8 }}>{h.en}</Sub>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
});
