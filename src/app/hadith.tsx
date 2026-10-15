import React, { useMemo, useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, Arabic, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { HADITHS, hadithOfTheDay, hadithText } from '../data/hadith';
import { fetchRandomHadith, type OnlineHadith } from '../lib/hadithApi';
import { FONTS } from '../lib/theme';

export default function Hadith() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [q, setQ] = useState('');
  const today = useMemo(() => hadithOfTheDay(), []);
  const [online, setOnline] = useState<OnlineHadith | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchMore = async () => {
    setFetching(true);
    setFetchError(false);
    const h = await fetchRandomHadith();
    setFetching(false);
    if (h) setOnline(h);
    else setFetchError(true);
  };

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return HADITHS;
    return HADITHS.filter(h =>
      hadithText(h, lang).toLowerCase().includes(query) ||
      h.en.toLowerCase().includes(query) ||
      h.topic.toLowerCase().includes(query));
  }, [q, lang]);

  return (
    <Screen>
      <Scroller>
        <Title>📜 {t('hadith', lang)}</Title>
        <Card style={{ borderColor: th.accent, borderWidth: 2 }}>
          <Sub style={{ fontWeight: '700', color: th.accent }}>{t('hadithOfDay', lang)} · {today.topic}</Sub>
          <Arabic size={20}>{today.ar}</Arabic>
          <Sub style={{ marginTop: 8 }}>{hadithText(today, lang)}</Sub>
          <Sub style={{ fontStyle: 'italic' }}>— {today.ref}</Sub>
        </Card>
        <TextInput placeholder={t('search', lang)} value={q} onChangeText={setQ}
          style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.card }]}
          placeholderTextColor={th.sub} />

        {/* Online hadith — fetched live, zero APK size */}
        <TouchableOpacity
          onPress={fetchMore}
          disabled={fetching}
          activeOpacity={0.8}
          style={[styles.moreBtn, { backgroundColor: th.primary }]}
        >
          {fetching ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.moreTxt}>🎲 Random Hadith (Online)</Text>
          )}
        </TouchableOpacity>
        {fetchError ? (
          <Sub style={{ textAlign: 'center', color: th.sub }}>
            Couldn't fetch — check your internet connection.
          </Sub>
        ) : null}
        {online ? (
          <Card style={{ borderColor: th.primary, borderWidth: 1.5 }}>
            <Sub style={{ fontWeight: '700', color: th.primary }}>🌐 {online.topic} · {online.ref}</Sub>
            <Arabic size={19}>{online.ar}</Arabic>
            <Sub style={{ marginTop: 8 }}>{online.en}</Sub>
          </Card>
        ) : null}

        {list.map(h => (
          <Card key={h.id}>
            <Sub style={{ fontWeight: '700', color: th.accent }}>{h.topic} · {h.ref}</Sub>
            <Arabic size={19}>{h.ar}</Arabic>
            <Sub style={{ marginTop: 8 }}>{hadithText(h, lang)}</Sub>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  moreBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  moreTxt: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bodySemi },
});
