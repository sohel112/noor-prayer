import React, { useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
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
          {['All', 'Favorites', ...DUA_CATEGORIES].map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}
              style={[styles.chip, { borderColor: th.border, backgroundColor: cat === c ? th.accentSoft : th.card }]}>
              <Text style={{ color: th.text, fontSize: 13 }}>{c}</Text>
            </TouchableOpacity>
          ))}
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
            <Sub style={{ marginTop: 8 }}>{lang === 'ur' ? d.ur : d.en}</Sub>
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
});
