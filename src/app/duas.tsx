import React, { useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, Arabic, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { DUAS, DUA_CATEGORIES } from '../data/duas';
import { getJSON, setJSON } from '../lib/storage';
import { useEffect } from 'react';

export default function Duas() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [cat, setCat] = useState<string>('All');
  const [q, setQ] = useState('');
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => { getJSON<string[]>('favorites', []).then(setFavs); }, []);

  const toggleFav = async (id: string) => {
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    await setJSON('favorites', next);
    setFavs(next);
  };

  const list = useMemo(() => {
    return DUAS.filter(d =>
      (cat === 'All' || d.category === cat || (cat === 'Favorites' && favs.includes(d.id))) &&
      (!q.trim() || d.en.toLowerCase().includes(q.toLowerCase()) || d.ur.includes(q.trim())),
    );
  }, [cat, q, favs]);

  return (
    <Screen>
      <Scroller>
        <Title>🤲 {t('duas', lang)}</Title>
        <TextInput placeholder={t('search', lang)} value={q} onChangeText={setQ}
          style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.card }]}
          placeholderTextColor={th.sub} />
        <View style={styles.cats}>
          {['All', 'Favorites', ...DUA_CATEGORIES].map(c => {
            const active = cat === c;
            return (
              <TouchableOpacity key={c} onPress={() => setCat(c)}
                style={[styles.chip, {
                  borderColor: active ? th.accent : th.border,
                  backgroundColor: active ? th.accent : th.card,
                  borderWidth: active ? 0 : 1,
                }]}>
                <Text style={{ color: active ? th.onAccent : th.text, fontSize: 13, fontWeight: active ? '800' : '600' }}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {list.map(d => (
          <Card key={d.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Sub style={{ fontWeight: '700', color: th.accent }}>{d.category}{d.ref ? ` · ${d.ref}` : ''}</Sub>
              <TouchableOpacity onPress={() => toggleFav(d.id)}>
                <Text style={{ fontSize: 18 }}>{favs.includes(d.id) ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
            <Arabic>{d.ar}</Arabic>
            <Sub style={{ marginTop: 8 }}>{lang === 'ur' ? d.ur : lang === 'hi' ? d.hi : d.en}</Sub>
          </Card>
        ))}

        {/* Tasbih quick counter */}
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={[{ color: th.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2.5 }]}>
            {t('tasbih', lang).toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/tasbih')}
            style={[styles.tasbihBtn, { borderColor: th.gold, backgroundColor: th.accentSoft }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 30 }}>📿</Text>
            <Text style={{ color: th.gold, fontWeight: '800', fontSize: 15, marginTop: 4 }}>
              {t('openCounter', lang)} →
            </Text>
          </TouchableOpacity>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  tasbihBtn: {
    borderWidth: 1.5, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40,
    alignItems: 'center', marginTop: 12,
  },
});
