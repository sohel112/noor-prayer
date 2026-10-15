import React, { useCallback, useMemo, useState } from 'react';
import {
  TextInput, TouchableOpacity, Text, View, StyleSheet, FlatList,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Sub, PillTabs, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { SURAHS, type SurahMeta } from '../../data/surahs';
import { JUZ_STARTS, juzOfSurah, type JuzStart } from '../../data/juz';
import { getJSON } from '../../lib/storage';

type Tab = 'surahs' | 'juz' | 'bookmarks';

type Row =
  | { kind: 'surah'; s: SurahMeta }
  | { kind: 'juz'; j: JuzStart }
  | { kind: 'bm'; surah: number; ayah: number; key: string };

function typeLabel(type: 'Makki' | 'Madani'): string {
  return type === 'Makki' ? 'Meccan' : 'Medinan';
}

export default function Quran() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('surahs');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number } | null>(null);

  const load = useCallback(async () => {
    const b = await getJSON<string[]>('bookmarks', []);
    setBookmarks(Array.isArray(b) ? b : []);
    // New shape {surah, ayah}; tolerate the legacy {s, a} shape.
    const lr = await getJSON<Record<string, unknown> | null>('lastRead', null);
    if (lr && typeof lr === 'object') {
      const surah = Number(lr.surah ?? lr.s ?? 0);
      const ayah = Number(lr.ayah ?? lr.a ?? 0);
      setLastRead(surah >= 1 && surah <= 114 && ayah >= 1 ? { surah, ayah } : null);
    } else {
      setLastRead(null);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const query = q.trim().toLowerCase();

  const surahList = useMemo(() => {
    if (!query) return SURAHS;
    return SURAHS.filter(s =>
      s.en.toLowerCase().includes(query) ||
      String(s.n) === query ||
      s.ar.includes(q.trim()),
    );
  }, [q, query]);

  const bookmarkItems = useMemo(() => {
    const items: { surah: number; ayah: number; key: string }[] = [];
    for (const b of bookmarks) {
      const [s, a] = String(b).split(':').map(Number);
      if (s >= 1 && s <= 114 && a >= 1) items.push({ surah: s, ayah: a, key: String(b) });
    }
    return items;
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (!query) return bookmarkItems;
    return bookmarkItems.filter(x => {
      const meta = SURAHS[x.surah - 1];
      return (
        meta.en.toLowerCase().includes(query) ||
        String(x.surah) === query ||
        meta.ar.includes(q.trim())
      );
    });
  }, [bookmarkItems, q, query]);

  const rows: Row[] = useMemo(() => {
    if (tab === 'surahs') return surahList.map(s => ({ kind: 'surah' as const, s }));
    if (tab === 'juz') return JUZ_STARTS.map(j => ({ kind: 'juz' as const, j }));
    return filteredBookmarks.map(x => ({ kind: 'bm' as const, ...x }));
  }, [tab, surahList, filteredBookmarks]);

  const lastMeta = lastRead ? SURAHS[lastRead.surah - 1] : null;
  const surahHasBookmark = (n: number) => bookmarks.some(b => String(b).startsWith(`${n}:`));

  const renderItem = ({ item }: { item: Row }) => {
    if (item.kind === 'surah') {
      const s = item.s;
      return (
        <TouchableOpacity onPress={() => router.push(`/surah/${s.n}`)} activeOpacity={0.75}>
          <Card style={styles.row}>
            <View style={[styles.emblem, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
              <Text style={[styles.emblemText, { color: th.primary }]}>{s.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: th.text }]}>
                {s.n}. {s.en}
              </Text>
              <Text style={[styles.rowSub, { color: th.sub }]}>
                {s.ayas} verses • {typeLabel(s.type)}
              </Text>
            </View>
            <Text style={[styles.arName, { color: th.text }]}>{s.ar}</Text>
            {surahHasBookmark(s.n) ? <Text style={{ fontSize: 15 }}>🔖</Text> : null}
            <Text style={[styles.chev, { color: th.sub }]}>›</Text>
          </Card>
        </TouchableOpacity>
      );
    }
    if (item.kind === 'juz') {
      const j = item.j;
      const meta = SURAHS[j.surah - 1];
      return (
        <TouchableOpacity onPress={() => router.push(`/surah/${j.surah}?ayah=${j.ayah}`)} activeOpacity={0.75}>
          <Card style={styles.row}>
            <View style={[styles.emblem, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
              <Text style={[styles.emblemText, { color: th.primary }]}>{j.juz}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: th.text }]}>Juz {j.juz}</Text>
              <Text style={[styles.rowSub, { color: th.sub }]}>
                Starts: Surah {meta.en} • Ayah {j.ayah}
              </Text>
            </View>
            <Text style={[styles.chev, { color: th.sub }]}>›</Text>
          </Card>
        </TouchableOpacity>
      );
    }
    const meta = SURAHS[item.surah - 1];
    return (
      <TouchableOpacity
        onPress={() => router.push(`/surah/${item.surah}?ayah=${item.ayah}`)}
        activeOpacity={0.75}
      >
        <Card style={styles.row}>
          <View style={[styles.emblem, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
            <Text style={{ fontSize: 17 }}>🔖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: th.text }]}>Surah {meta.en}</Text>
            <Text style={[styles.rowSub, { color: th.sub }]}>
              Ayah {item.ayah} • {meta.ar}
            </Text>
          </View>
          <Text style={[styles.chev, { color: th.sub }]}>›</Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Screen edges={['top']}>
      <FlatList
        data={rows}
        keyExtractor={item =>
          item.kind === 'surah' ? `s${item.s.n}`
          : item.kind === 'juz' ? `j${item.j.juz}`
          : `b${item.key}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 14 }}>
            {/* Heading + settings */}
            <View style={styles.headRow}>
              <Heading size={30}>{t('quran', lang)}</Heading>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/more')}
                style={[styles.gear, { backgroundColor: th.card, borderColor: th.border }]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: th.card, borderColor: th.border }]}>
              <Text style={{ fontSize: 16, color: th.sub }}>🔍</Text>
              <TextInput
                placeholder="Search Surah, Ayah or Keyword..."
                value={q}
                onChangeText={setQ}
                style={[styles.searchInput, { color: th.text }]}
                placeholderTextColor={th.sub}
                returnKeyType="search"
              />
              {q.length > 0 ? (
                <TouchableOpacity onPress={() => setQ('')}>
                  <Text style={{ fontSize: 16, color: th.sub }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Last Read */}
            {lastMeta && lastRead ? (
              <Card style={styles.lastCard}>
                <View style={styles.lastRow}>
                  <View style={[styles.cover, { backgroundColor: th.primary }]}>
                    <Text style={{ fontSize: 30 }}>📖</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lastLabel, { color: th.sub }]}>Last Read</Text>
                    <Text style={[styles.lastSurah, { color: th.text }]}>
                      Surah {lastMeta.en}
                    </Text>
                    <Text style={[styles.lastAyah, { color: th.sub }]}>
                      Ayah {lastRead.ayah} • Juz {juzOfSurah(lastRead.surah)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/surah/${lastRead.surah}?ayah=${lastRead.ayah}`)}
                  activeOpacity={0.85}
                  style={[styles.continueBtn, { backgroundColor: th.primary }]}
                >
                  <Text style={[styles.continueText, { color: th.onPrimary }]}>
                    {t('continueReading', lang)}
                  </Text>
                </TouchableOpacity>
              </Card>
            ) : null}

            {/* Tabs */}
            <PillTabs
              options={['surahs', 'juz', 'bookmarks'] as const}
              value={tab}
              onChange={setTab}
              labels={{
                surahs: t('surahs', lang),
                juz: 'Juz',
                bookmarks: `${t('bookmarks', lang)} (${bookmarkItems.length})`,
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🔖</Text>
            <Sub style={{ marginTop: 8, textAlign: 'center' }}>
              {tab === 'bookmarks' ? 'No bookmarks yet' : t('noResults', lang)}
            </Sub>
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gear: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12 },
  lastCard: { gap: 14 },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cover: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  lastLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  lastSurah: { fontSize: 19, fontWeight: '800', marginTop: 4 },
  lastAyah: { fontSize: 13, marginTop: 2 },
  continueBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  continueText: { fontWeight: '800', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  emblem: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  emblemText: { fontWeight: '800', fontSize: 16 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 13, marginTop: 3 },
  arName: { fontSize: 20 },
  chev: { fontSize: 24, fontWeight: '300' },
  empty: { alignItems: 'center', paddingVertical: 36 },
});
