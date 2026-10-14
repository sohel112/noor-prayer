import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
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
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ayah, setAyah] = useState(1);
  const [error, setError] = useState('');
  const soundRef = useRef<Audio.Sound | null>(null);

  const totalAyahs = SURAHS[surah - 1]?.ayas ?? 7;

  const stop = async () => {
    try { await soundRef.current?.unloadAsync(); } catch { /* noop */ }
    soundRef.current = null;
    setPlaying(false);
  };

  const playAyah = async (n: number) => {
    await stop();
    setLoading(true);
    setError('');
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: ayahAudioUrl(reciter, surah, n) },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setAyah(n);
      setPlaying(true);
      setLoading(false);
      sound.setOnPlaybackStatusUpdate(st => {
        if (st.isLoaded && st.didJustFinish) {
          if (n < totalAyahs) playAyah(n + 1);
          else stop();
        }
      });
    } catch {
      setLoading(false);
      setError('Audio stream unavailable. Check your connection and try again.');
    }
  };

  useEffect(() => () => { stop(); }, []);

  const pickSurah = (d: number) => {
    const next = Math.min(114, Math.max(1, surah + d));
    setSurah(next);
    stop();
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
              <TouchableOpacity key={r.id} onPress={() => { setReciter(r); stop(); }}
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
              onPress={() => (playing ? stop() : playAyah(ayah))}
            >
              <Text style={{ color: '#fff', fontSize: 22 }}>{playing ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.play, { borderColor: th.border, borderWidth: 1 }]} onPress={() => playAyah(1)}>
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
