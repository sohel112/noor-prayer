import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity, Text, View, StyleSheet, FlatList, type ViewToken,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Screen, Card, Sub, TopBar, useTheme } from '../../components/ui';
import { useSettings, type Lang } from '../../lib/settings';
import { SURAHS } from '../../data/surahs';
import { juzOfSurah } from '../../data/juz';
import { RECITERS, ayahAudioUrl } from '../../lib/audioSource';
import { getJSON, setJSON } from '../../lib/storage';
import quranData from '../../../assets/data/quran.json';
import tafsirData from '../../../assets/data/tafsir.json';

interface Verse { n: number; ar: string; en: string; ur: string; hi: string; }

type TafsirEntry = { intro?: string; verses?: Record<string, string> };

const TR_ORDER: Lang[] = ['en', 'hi', 'ur'];

function fmtTime(s: number): string {
  const v = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
}

function ActionBtn({ icon, label, onPress, active }: {
  icon: string; label: string; onPress: () => void; active?: boolean;
}) {
  const th = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn} activeOpacity={0.7}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[styles.actionLabel, { color: active ? th.primary : th.sub }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SurahReader() {
  const { id, ayah } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNum = Math.min(114, Math.max(1, parseInt(id ?? '1', 10) || 1));
  // Remount on surah change so all reading/audio state resets cleanly.
  return <ReaderBody key={surahNum} surahNum={surahNum} ayahParam={ayah} />;
}

function ReaderBody({ surahNum, ayahParam }: { surahNum: number; ayahParam?: string }) {
  const ayah = ayahParam;
  const { settings, update } = useSettings();
  const th = useTheme();
  const tr = settings.translation;

  const meta = SURAHS[surahNum - 1];
  const verses: Verse[] = useMemo(() => {
    const s = (quranData as any).surahs.find((x: any) => x.n === surahNum);
    return s ? s.verses : [];
  }, [surahNum]);
  const totalAyahs = verses.length;

  const startAyah = useMemo(() => {
    const a = parseInt(ayah ?? '1', 10);
    if (!Number.isFinite(a) || a < 1) return 1;
    return Math.min(a, Math.max(totalAyahs, 1));
  }, [ayah, totalAyahs]);

  const tafsir: TafsirEntry | undefined = (tafsirData as Record<string, TafsirEntry>)[String(surahNum)];
  const hasTafsir = !!tafsir;

  // --- reading state (kept from previous version) ---
  const [bookmarked, setBookmarked] = useState(false);
  const [firstAyah, setFirstAyah] = useState(1);
  const [hifzMode, setHifzMode] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [memorized, setMemorized] = useState<Record<number, boolean>>({});
  const [openTafsir, setOpenTafsir] = useState<Record<number, boolean>>({});
  const [expandAllTafsir, setExpandAllTafsir] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  // --- audio player state ---
  const [showPlayer, setShowPlayer] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioAyah, setAudioAyah] = useState(1);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const player = useAudioPlayer(ayahAudioUrl(RECITERS[0], surahNum, 1));
  const scrollFailedRef = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  // stop audio when leaving the screen (remount resets the rest via key)
  useEffect(() => {
    return () => { try { player.pause(); } catch { /* ignore */ } };
  }, [player]);

  const playAyah = useCallback((a: number) => {
    const target = Math.min(Math.max(1, a), Math.max(totalAyahs, 1));
    setAudioAyah(target);
    setShowPlayer(true);
    setPos(0);
    try {
      player.replace(ayahAudioUrl(RECITERS[0], surahNum, target));
      player.play();
    } catch { /* audio unavailable — player stays hidden-safe */ }
  }, [player, surahNum, totalAyahs]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st: any) => {
      setPlaying(!!st.playing);
      if (typeof st.currentTime === 'number') setPos(st.currentTime);
      if (typeof st.duration === 'number' && st.duration > 0) setDur(st.duration);
      if (st.didJustFinish) {
        if (audioAyah < totalAyahs) {
          playAyah(audioAyah + 1);
        } else {
          try { player.pause(); player.seekTo(0); } catch { /* ignore */ }
        }
      }
    });
    return () => sub.remove();
  }, [player, audioAyah, totalAyahs, playAyah]);

  const togglePlay = () => {
    try {
      if (playing) player.pause();
      else player.play();
    } catch { /* ignore */ }
  };

  const seekBy = (d: number) => {
    try {
      player.seekTo(Math.min(Math.max(0, pos + d), dur || 0));
    } catch { /* ignore */ }
  };

  // --- bookmarks / hifz / last-read (kept, now ayah-level) ---
  useEffect(() => {
    getJSON<string[]>('bookmarks', []).then(b =>
      setBookmarked(b.includes(`${surahNum}:${startAyah}`)),
    );
    getJSON<Record<string, string>>('hifz', {}).then(h => {
      const m: Record<number, boolean> = {};
      Object.keys(h).forEach(k => {
        const [s, a] = k.split(':');
        if (parseInt(s, 10) === surahNum && h[k] === 'memorized') m[parseInt(a, 10)] = true;
      });
      setMemorized(m);
    });
  }, [surahNum, startAyah]);

  const toggleBookmark = async () => {
    const b = await getJSON<string[]>('bookmarks', []);
    const key = `${surahNum}:${firstAyah}`;
    const next = b.includes(key) ? b.filter(x => x !== key) : [...b, key];
    await setJSON('bookmarks', next);
    setBookmarked(!bookmarked);
  };

  const toggleMemorized = useCallback(async (n: number) => {
    const key = `${surahNum}:${n}`;
    const all = await getJSON<Record<string, string>>('hifz', {});
    const isMem = all[key] === 'memorized';
    if (isMem) delete all[key]; else all[key] = 'memorized';
    await setJSON('hifz', all);
    setMemorized(prev => ({ ...prev, [n]: !isMem }));
  }, [surahNum]);

  const onViewableItemsChanged = useCallback(async ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as Verse | undefined;
    if (!first) return;
    setFirstAyah(first.n);
    const b = await getJSON<string[]>('bookmarks', []);
    setBookmarked(b.includes(`${surahNum}:${first.n}`));
    await setJSON('lastRead', { surah: surahNum, ayah: first.n });
  }, [surahNum]);

  // --- scroll to requested ayah (?ayah=N from library/juz/bookmarks) ---
  const listRef = useRef<FlatList<Verse>>(null);
  useEffect(() => {
    if (startAyah <= 1 || totalAyahs === 0) return;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index: startAyah - 1, animated: false });
      } catch { /* fallback handled by onScrollToIndexFailed */ }
    }, 350);
    return () => clearTimeout(t);
  }, [surahNum, startAyah, totalAyahs]);

  const cycleTranslation = () => {
    const idx = TR_ORDER.indexOf(tr as Lang);
    update({ translation: TR_ORDER[(idx + 1) % TR_ORDER.length] });
  };

  const memCount = Object.values(memorized).filter(Boolean).length;

  const renderVerse = ({ item }: { item: Verse }) => {
    const tafsirText = tafsir?.verses?.[String(item.n)];
    const isOpen = !!openTafsir[item.n] || expandAllTafsir;
    const isRevealed = !!revealed[item.n];
    const isMem = !!memorized[item.n];
    const showArabic = !hifzMode || isRevealed;

    return (
      <Card style={[styles.verse, isMem && { borderColor: th.accent, borderWidth: 2 }]}>
        <View style={styles.verseTop}>
          <View style={[styles.ayahBadge, { backgroundColor: th.primary }]}>
            <Text style={[styles.ayahBadgeText, { color: th.onPrimary }]}>{item.n}</Text>
          </View>
          {tafsirText ? (
            <TouchableOpacity onPress={() => setOpenTafsir(p => ({ ...p, [item.n]: !p[item.n] }))}>
              <Text style={[styles.tafsirLink, { color: th.primary }]}>
                📖 {openTafsir[item.n] ? 'Hide tafsir' : 'Tafsir'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {showArabic ? (
          <Text style={[styles.arabic, { color: th.text }]}>{item.ar}</Text>
        ) : (
          <TouchableOpacity
            onPress={() => setRevealed(p => ({ ...p, [item.n]: true }))}
            style={[styles.hiddenBox, { borderColor: th.border, backgroundColor: th.accentSoft }]}
          >
            <Text style={{ color: th.primary, fontSize: 15, fontWeight: '700' }}>
              👁 Tap to reveal Arabic
            </Text>
            <Text style={{ color: th.sub, fontSize: 12, marginTop: 4 }}>
              Recite from memory first, then check
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.trans, { color: th.sub }]}>
          {tr === 'ur' ? item.ur : tr === 'hi' ? item.hi : item.en}
        </Text>

        {hifzMode ? (
          <TouchableOpacity onPress={() => toggleMemorized(item.n)} style={{ marginTop: 10 }}>
            <Text style={[styles.memBtn, { color: isMem ? th.accent : th.sub }]}>
              {isMem ? '✓ Memorized' : '○ Mark memorized'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isOpen && tafsirText ? (
          <View style={[styles.tafsirBox, { backgroundColor: th.accentSoft, borderColor: th.accent }]}>
            <Text style={[styles.tafsirLabel, { color: th.accent }]}>TAFSIR</Text>
            <Text style={[styles.tafsirText, { color: th.text }]}>{tafsirText}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <TopBar
        title={meta ? `Surah ${meta.en}` : `Surah ${surahNum}`}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={toggleBookmark} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>{bookmarked ? '🔖' : '📑'}</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.subHead}>
        <Sub style={styles.subHeadText}>
          {meta?.ayas ?? 0} verses • Juz {juzOfSurah(surahNum)} •{' '}
          {meta?.type === 'Makki' ? 'Meccan' : 'Medinan'}
        </Sub>
        <TouchableOpacity
          onPress={() => { setHifzMode(v => !v); setRevealed({}); }}
          activeOpacity={0.7}
          style={[styles.hifzChip, { backgroundColor: hifzMode ? th.primary : th.chip }]}
        >
          <Text style={{
            color: hifzMode ? th.onPrimary : th.primary,
            fontSize: 12, fontWeight: '700',
          }}>
            🧠 {hifzMode ? 'ON' : 'Hifz'}
          </Text>
        </TouchableOpacity>
      </View>

      {hifzMode ? (
        <View style={[styles.hifzBar, { backgroundColor: th.accentSoft, borderBottomColor: th.border }]}>
          <Text style={{ color: th.text, fontSize: 13, fontWeight: '700' }}>
            🧠 Hifz Mode — {memCount}/{totalAyahs} memorized
          </Text>
          <View style={[styles.progressBg, { backgroundColor: th.border }]}>
            <View style={[
              styles.progressFill,
              { backgroundColor: th.accent, width: `${totalAyahs ? (memCount / totalAyahs) * 100 : 0}%` },
            ]} />
          </View>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={v => String(v.n)}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollToIndexFailed={info => {
          if (scrollFailedRef.current) return;
          scrollFailedRef.current = true;
          listRef.current?.scrollToOffset({
            offset: Math.max(0, info.index * info.averageItemLength - 100),
            animated: false,
          });
        }}
        ListHeaderComponent={
          hasTafsir && tafsir?.intro ? (
            <TouchableOpacity
              onPress={() => setShowIntro(v => !v)}
              activeOpacity={0.8}
              style={[styles.introCard, { backgroundColor: th.card, borderColor: th.accent }]}
            >
              <Text style={[styles.introTitle, { color: th.accent }]}>
                📖 About this Surah {showIntro ? '▾' : '▸'}
              </Text>
              {showIntro ? (
                <Text style={[styles.introText, { color: th.text }]}>{tafsir.intro}</Text>
              ) : null}
            </TouchableOpacity>
          ) : null
        }
        renderItem={renderVerse}
      />

      {/* Sticky audio player */}
      {showPlayer ? (
        <View style={[styles.playerWrap, { backgroundColor: th.card, borderTopColor: th.border }]}>
          <View style={styles.playerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.playerTitle, { color: th.text }]} numberOfLines={1}>
                Surah {meta?.en} — Ayah {audioAyah}
              </Text>
              <Text style={[styles.playerSub, { color: th.sub }]}>
                {RECITERS[0].name} • Recitation
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { try { player.pause(); } catch { /* ignore */ } setShowPlayer(false); }}
              style={styles.playerClose}
            >
              <Text style={{ color: th.sub, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.track, { backgroundColor: th.border }]}>
            <View style={[
              styles.fill,
              {
                backgroundColor: th.primary,
                width: `${dur > 0 ? Math.min(100, (pos / dur) * 100) : 0}%`,
              },
            ]} />
          </View>
          <View style={styles.controls}>
            <Text style={[styles.time, { color: th.sub }]}>{fmtTime(pos)}</Text>
            <TouchableOpacity onPress={() => seekBy(-10)} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: th.text }]}>↺ 10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePlay}
              activeOpacity={0.85}
              style={[styles.playBtn, { backgroundColor: th.primary }]}
            >
              <Text style={{ color: th.onPrimary, fontSize: 20 }}>{playing ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekBy(10)} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: th.text }]}>10 ↻</Text>
            </TouchableOpacity>
            <Text style={[styles.time, { color: th.sub }]}>{fmtTime(dur)}</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom action row */}
      <View style={[styles.actionRow, { backgroundColor: th.card, borderTopColor: th.border }]}>
        <ActionBtn
          icon="🔊"
          label="Audio"
          active={showPlayer}
          onPress={() => {
            if (showPlayer) {
              try { player.pause(); } catch { /* ignore */ }
              setShowPlayer(false);
            } else {
              playAyah(firstAyah);
            }
          }}
        />
        <ActionBtn
          icon="🌐"
          label={`Translation · ${String(tr).toUpperCase()}`}
          onPress={cycleTranslation}
        />
        <ActionBtn
          icon="📖"
          label="Tafsir"
          active={expandAllTafsir}
          onPress={() => setExpandAllTafsir(v => !v)}
        />
        <ActionBtn
          icon="⚙️"
          label="Settings"
          onPress={() => router.push('/(tabs)/more')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  subHeadText: { flex: 1, textAlign: 'center', fontSize: 13 },
  hifzChip: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  hifzBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  progressBg: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  introCard: { borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 4 },
  introTitle: { fontSize: 15, fontWeight: '800' },
  introText: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  verse: { gap: 10 },
  verseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ayahBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  ayahBadgeText: { fontWeight: '800', fontSize: 15 },
  tafsirLink: { fontSize: 13, fontWeight: '700' },
  arabic: { fontSize: 24, lineHeight: 52, textAlign: 'right', writingDirection: 'rtl' },
  trans: { fontSize: 14, lineHeight: 22 },
  memBtn: { fontSize: 13, fontWeight: '700' },
  hiddenBox: {
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    padding: 20, alignItems: 'center',
  },
  tafsirBox: { borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  tafsirLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  tafsirText: { fontSize: 14, lineHeight: 22 },
  playerWrap: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  playerTitle: { fontSize: 14, fontWeight: '800' },
  playerSub: { fontSize: 12, marginTop: 2 },
  playerClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 18, marginTop: 10,
  },
  time: { fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 38, textAlign: 'center' },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, fontWeight: '700' },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F6B4F', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  actionRow: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingVertical: 6, paddingBottom: 10,
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 4 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
});
