import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { SURAHS } from '../data/surahs';
import { RECITERS, ayahAudioUrl } from '../lib/audioSource';

export default function QuranAudio() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [surah, setSurah] = useState(1);
  const [reciter, setReciter] = useState(RECITERS[0]);
  const [loading, setLoading] = useState(false);
  const [ayah, setAyah] = useState(1);
  const [error, setError] = useState('');

  const player = useAudioPlayer(ayahAudioUrl(reciter, surah, ayah));
  const [playing, setPlaying] = useState(false);

  const totalAyahs = SURAHS[surah - 1]?.ayas ?? 7;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st: any) => {
      setPlaying(!!st.playing);
      if (st.didJustFinish) {
        if (ayah < totalAyahs) {
          setAyah(a => a + 1);
        } else {
          player.pause();
          player.seekTo(0);
        }
      }
    });
    return () => sub.remove();
  }, [player, ayah, totalAyahs]);

  // When ayah changes, replace source and play
  useEffect(() => {
    player.replace(ayahAudioUrl(reciter, surah, ayah));
    setLoading(true);
    setError('');
    const timer = setTimeout(() => setLoading(false), 1500);
    player.play();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayah, surah, reciter]);

  const toggle = () => {
    if (playing) player.pause();
    else player.play();
  };

  const stopAll = () => {
    player.pause();
    player.seekTo(0);
    setPlaying(false);
  };

  const pickSurah = (d: number) => {
    const next = Math.min(114, Math.max(1, surah + d));
    stopAll();
    setSurah(next);
    setAyah(1);
  };

  return (
    <Screen>
      <Scroller>
        <Title>🔊 Quran Audio</Title>
        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>Reciter</Sub>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {RECITERS.map(r => (
              <TouchableOpacity key={r.id} onPress={() => { setReciter(r); stopAll(); setAyah(1); }}
                style={[styles.chip, { borderColor: th.border, backgroundColor: reciter.id === r.id ? th.accent : th.card }]}>
                <Text style={{ color: reciter.id === r.id ? '#fff' : th.text, fontWeight: '600' }}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => pickSurah(-1)} style={[styles.nav, { borderColor: th.border }]}>
              <Text style={{ color: th.text, fontSize: 20 }}>‹</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: th.text, fontSize: 20, fontWeight: '800' }}>{SURAHS[surah - 1]?.en}</Text>
              <Text style={{ color: th.text, fontSize: 26 }}>{SURAHS[surah - 1]?.ar}</Text>
            </View>
            <TouchableOpacity onPress={() => pickSurah(1)} style={[styles.nav, { borderColor: th.border }]}>
              <Text style={{ color: th.text, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          </View>
          <Sub style={{ marginTop: 8 }}>Ayah {ayah} of {totalAyahs}</Sub>
          {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={th.accent} /> : null}
          {error ? <Sub style={{ marginTop: 8, textAlign: 'center' }}>{error}</Sub> : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.play, { backgroundColor: th.accent }]}
              onPress={toggle}
            >
              <Text style={{ color: th.onAccent, fontSize: 22 }}>{playing ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.play, { borderColor: th.border, borderWidth: 1 }]} onPress={() => { stopAll(); setAyah(1); }}>
              <Text style={{ color: th.text, fontSize: 18 }}>⏮</Text>
            </TouchableOpacity>
          </View>
          <Sub style={{ marginTop: 12, textAlign: 'center' }}>
            Streams ayah-by-ayah (free). Play continues automatically.
          </Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  nav: { borderWidth: 1, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
