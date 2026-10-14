import React, { useEffect, useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { SURAHS } from '../../data/surahs';
import { getJSON } from '../../lib/storage';

export default function Quran() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [q, setQ] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [lastRead, setLastRead] = useState<{ s: number; a: number } | null>(null);

  useEffect(() => {
    getJSON<number[]>('bookmarks', []).then(setBookmarks);
    getJSON<{ s: number; a: number } | null>('lastRead', null).then(setLastRead);
  }, []);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return SURAHS;
    return SURAHS.filter(s =>
      s.en.toLowerCase().includes(query) || String(s.n) === query || s.ar.includes(q.trim()),
    );
  }, [q]);

  return (
    <Screen>
      <Scroller>
        <Title>📖 {t('quran', lang)}</Title>
        {lastRead ? (
          <TouchableOpacity onPress={() => router.push(`/surah/${lastRead.s}`)}>
            <Card style={{ borderColor: th.accent, borderWidth: 2 }}>
              <Sub>▶ {t('resume', lang)}: {SURAHS[lastRead.s - 1]?.en} — ayah {lastRead.a}</Sub>
            </Card>
          </TouchableOpacity>
        ) : null}
        <TextInput
          placeholder={t('search', lang)} value={q} onChangeText={setQ}
          style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.card }]}
          placeholderTextColor={th.sub}
        />
        {list.map(s => (
          <TouchableOpacity key={s.n} onPress={() => router.push(`/surah/${s.n}`)}>
            <Card style={styles.row}>
              <View style={[styles.num, { backgroundColor: th.accentSoft }]}>
                <Text style={{ color: th.accent, fontWeight: '700' }}>{s.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 16, fontWeight: '700' }}>{s.en}</Text>
                <Sub>{s.ayas} ayahs · {s.type}</Sub>
              </View>
              <Text style={{ color: th.text, fontSize: 22 }}>{s.ar}</Text>
              {bookmarks.includes(s.n) ? <Text>🔖</Text> : null}
            </Card>
          </TouchableOpacity>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  num: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
