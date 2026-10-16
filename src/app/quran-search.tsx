// Deen — Quran Verse Search Screen

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Sub, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';
import { searchQuran, totalVerses, type SearchResult } from '../lib/quranSearch';

const EXAMPLES = ['mercy', 'patience', 'gratitude', 'light', 'forgiveness'];

export default function QuranSearch() {
  const th = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = (q?: string) => {
    const text = (q ?? query).trim();
    if (text.length < 2) return;
    setQuery(text);
    setResults(searchQuran(text));
    setSearched(true);
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => router.push(`/surah/${item.surah}`)}
      style={[styles.result, { borderColor: th.border, backgroundColor: th.card }]}
    >
      <View style={styles.refRow}>
        <Text style={[styles.ref, { color: th.primary }]}>
          {item.surahName} {item.surah}:{item.ayah}
        </Text>
      </View>
      <Text style={[styles.arabic, { color: th.text }]} numberOfLines={2}>
        {item.textAr}
      </Text>
      <Text style={[styles.english, { color: th.sub }]} numberOfLines={3}>
        {item.textEn}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Screen edges={['top']}>
      <TopBar title="🔍 Quran Search" onBack={() => router.back()} />
      <View style={[styles.searchBar, { backgroundColor: th.card, borderColor: th.border }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${totalVerses().toLocaleString()} verses...`}
          placeholderTextColor={th.sub}
          style={[styles.input, { color: th.text }]}
          onSubmitEditing={() => doSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={() => doSearch()}
          style={[styles.goBtn, { backgroundColor: th.primary }]}
        >
          <Text style={styles.goText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {!searched ? (
        <View style={styles.examples}>
          <Sub style={{ textAlign: 'center', marginBottom: 12 }}>Try searching for:</Sub>
          <View style={styles.chips}>
            {EXAMPLES.map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => doSearch(e)}
                style={[styles.chip, { borderColor: th.accent, backgroundColor: th.accentSoft }]}
              >
                <Text style={[styles.chipText, { color: th.accent }]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Sub style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>
            Search in English or Arabic across the entire Quran
          </Sub>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.surah}:${item.ayah}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Card style={{ margin: 16 }}>
              <Sub style={{ textAlign: 'center', paddingVertical: 20 }}>
                No verses found for "{query}".{'\n'}Try different words.
              </Sub>
            </Card>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.count, { color: th.sub }]}>
                {results.length} verse{results.length !== 1 ? 's' : ''} found
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, marginBottom: 8, borderWidth: 1, borderRadius: 12,
    paddingLeft: 14,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  goBtn: { borderRadius: 10, padding: 10, margin: 4 },
  goText: { fontSize: 18 },
  examples: { padding: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  chipText: { fontSize: 14, fontFamily: FONTS.bodySemi },
  list: { padding: 16, paddingTop: 8 },
  count: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  result: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  refRow: { marginBottom: 8 },
  ref: { fontSize: 13, fontFamily: FONTS.bodyBold },
  arabic: { fontSize: 18, lineHeight: 32, textAlign: 'right', marginBottom: 8 },
  english: { fontSize: 14, lineHeight: 20 },
});
