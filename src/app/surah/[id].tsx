import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { SURAHS } from '../../data/surahs';
import { getJSON, setJSON } from '../../lib/storage';
import quranData from '../../../assets/data/quran.json';

interface Verse { n: number; ar: string; en: string; ur: string; hi: string; }

export default function SurahReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNum = parseInt(id ?? '1', 10);
  const { settings } = useSettings();
  const th = useTheme();
  const [bookmarked, setBookmarked] = useState(false);

  const meta = SURAHS[surahNum - 1];
  const verses: Verse[] = useMemo(() => {
    const s = (quranData as any).surahs.find((x: any) => x.n === surahNum);
    return s ? s.verses : [];
  }, [surahNum]);

  useEffect(() => {
    getJSON<number[]>('bookmarks', []).then(b => setBookmarked(b.includes(surahNum)));
  }, [surahNum]);

  const toggleBookmark = async () => {
    const b = await getJSON<number[]>('bookmarks', []);
    const next = b.includes(surahNum) ? b.filter(x => x !== surahNum) : [...b, surahNum];
    await setJSON('bookmarks', next);
    setBookmarked(!bookmarked);
  };

  const onViewable = async (n: number) => {
    await setJSON('lastRead', { s: surahNum, a: n }); // auto-save resume point
  };

  const tr = settings.translation;

  return (
    <Screen>
      <View style={[styles.header, { backgroundColor: th.card, borderBottomColor: th.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: th.accent, fontSize: 16 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ color: th.text, fontSize: 17, fontWeight: '700' }}>
          {meta?.en} ({surahNum})
        </Text>
        <TouchableOpacity onPress={toggleBookmark}>
          <Text style={{ fontSize: 18 }}>{bookmarked ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={verses}
        keyExtractor={v => String(v.n)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.item as Verse | undefined;
          if (first) onViewable(first.n);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.verse, { backgroundColor: th.card, borderColor: th.border }]}>
            <View style={[styles.badge, { backgroundColor: th.accentSoft }]}>
              <Text style={{ color: th.accent, fontWeight: '700', fontSize: 12 }}>{item.n}</Text>
            </View>
            <Text style={[styles.arabic, { color: th.text }]}>{item.ar}</Text>
            <Text style={[styles.trans, { color: th.sub }]}>
              {tr === 'ur' ? item.ur : tr === 'hi' ? item.hi : item.en}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  verse: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  arabic: { fontSize: 22, lineHeight: 44, textAlign: 'right', writingDirection: 'rtl' },
  trans: { fontSize: 14, lineHeight: 22, marginTop: 8 },
});
