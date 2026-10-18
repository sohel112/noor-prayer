import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, useTheme, PrimaryButton } from '../components/ui';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../data/quizQuestions';
import { FONTS } from '../lib/theme';
import { AdBanner } from '../components/AdBanner';
import { preloadInterstitial, showInterstitial } from '../lib/adInterstitial';
import { preloadSimpleRewardedAd } from '../lib/adRewardedSimple';

const BEST_KEY = 'noor.quizbest.v1';
const SEEN_KEY = 'noor.quizseen.v1';
const ONLINE_CACHE_KEY = 'noor.quizonline.v1';
const ROUND_SIZE = 10;
// Online question bank — new questions fetched from here when local bank is exhausted.
// Maintained in the sohel112/noor-prayer GitHub repo; cached offline after first fetch.
const ONLINE_BANK_URL = 'https://raw.githubusercontent.com/sohel112/noor-prayer/main/quiz-questions.json';

type Phase = 'start' | 'quiz' | 'done';

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle options and remap the answer index so option order is fresh every time. */
function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const order = shuffled([0, 1, 2, 3]);
  const options = order.map(i => q.options[i]) as [string, string, string, string];
  return { ...q, options, answer: order.indexOf(q.answer) };
}

export default function Quiz() {
  const th = useTheme();
  const [phase, setPhase] = useState<Phase>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Preload ads early so they're ready at natural break points.
    preloadInterstitial();
    preloadSimpleRewardedAd();
    AsyncStorage.getItem(BEST_KEY).then(v => {
      const n = parseInt(v ?? '0', 10);
      if (Number.isFinite(n)) setBest(n);
    }).catch(() => {});
    // Show how many bonus online questions are cached.
    AsyncStorage.getItem(ONLINE_CACHE_KEY).then(v => {
      try {
        const arr = v ? JSON.parse(v) : [];
        if (Array.isArray(arr)) setOnlineCount(arr.length);
      } catch { /* ignore */ }
    }).catch(() => {});
  }, []);

  /** Fetch fresh online questions (cached for offline use). Returns [] on failure. */
  const fetchOnlineQuestions = async (): Promise<QuizQuestion[]> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(ONLINE_BANK_URL, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.questions;
      if (!Array.isArray(list)) return [];
      const valid = list.filter(
        (q: any) =>
          q && typeof q.q === 'string' && Array.isArray(q.options) &&
          q.options.length === 4 && typeof q.answer === 'number' &&
          q.answer >= 0 && q.answer < 4,
      ).map((q: any) => ({
        q: q.q,
        options: q.options as [string, string, string, string],
        answer: q.answer as number,
        category: (['Quran', 'Seerah', 'Fiqh', 'History'] as const).includes(q.category) ? q.category : 'History' as const,
      }));
      if (valid.length > 0) {
        await AsyncStorage.setItem(ONLINE_CACHE_KEY, JSON.stringify(valid)).catch(() => {});
        setOnlineCount(valid.length);
      }
      return valid;
    } catch {
      // Offline or fetch failed — fall back to cached copy.
      try {
        const raw = await AsyncStorage.getItem(ONLINE_CACHE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
  };

  const start = async () => {
    setLoading(true);
    try {
      // Smart no-repeat: prefer questions not asked recently. Once all have
      // been seen, fetch fresh online questions — quizzes never run out.
      let seen: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(SEEN_KEY);
        if (raw) seen = JSON.parse(raw) as string[];
      } catch { /* ignore */ }
      const seenSet = new Set(seen);
      let pool = QUIZ_QUESTIONS.filter(q => !seenSet.has(q.q));

      // Local bank exhausted? Fetch new questions online.
      if (pool.length < ROUND_SIZE) {
        const online = await fetchOnlineQuestions();
        const freshOnline = online.filter(q => !seenSet.has(q.q));
        if (freshOnline.length > 0) {
          pool = freshOnline;
        } else {
          pool = [...QUIZ_QUESTIONS, ...online]; // full reset with everything
        }
      }

      const pickedQs = shuffled(pool).slice(0, ROUND_SIZE).map(shuffleOptions);
      // Remember these so next rounds feel fresh.
      const totalBank = QUIZ_QUESTIONS.length + onlineCount;
      const updated = [...seen, ...pickedQs.map(q => q.q)].slice(-Math.max(totalBank, 1));
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(updated)).catch(() => {});
      setQuestions(pickedQs);
      setIdx(0);
      setPicked(null);
      setScore(0);
      setPhase('quiz');
    } finally {
      setLoading(false);
    }
  };

  const current = questions[idx];

  const pick = (i: number) => {
    if (picked !== null) return; // locked after answering
    setPicked(i);
    if (i === current.answer) setScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      const final = score;
      setPhase('done');
      // Natural break point: show interstitial after quiz completion
      // (90s gap enforced inside; never during the quiz itself).
      setTimeout(() => showInterstitial(), 800);
      if (final > best) {
        setBest(final);
        AsyncStorage.setItem(BEST_KEY, String(final)).catch(() => {});
      }
    } else {
      setIdx(i => i + 1);
      setPicked(null);
    }
  };

  const progress = useMemo(
    () => (phase === 'quiz' ? `${idx + 1} / ${questions.length}` : ''),
    [phase, idx, questions.length],
  );

  return (
    <Screen>
      <Scroller>
        <Title>❓ Islamic Quiz</Title>

        {phase === 'start' ? (
          <>
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ fontSize: 56 }}>🕌</Text>
              <Sub style={{ marginTop: 12, textAlign: 'center' }}>
                Test your knowledge! 10 random questions from Quran, Seerah, Fiqh and History.
              </Sub>
              {best > 0 ? (
                <Sub style={{ marginTop: 8, fontFamily: FONTS.bodySemi, color: th.primary }}>
                  🏆 Best score: {best} / {ROUND_SIZE}
                </Sub>
              ) : null}
              {onlineCount > 0 ? (
                <Sub style={{ marginTop: 6, textAlign: 'center' }}>
                  🌐 +{onlineCount} bonus questions from online bank
                </Sub>
              ) : null}
              <View style={{ width: '100%', marginTop: 18 }}>
                <PrimaryButton
                  label={loading ? 'Loading…' : 'Start Quiz'}
                  onPress={start}
                />
              </View>
            </Card>
          </>
        ) : null}

        {phase === 'quiz' && current ? (
          <>
            <Sub style={{ marginBottom: 8, textAlign: 'right', fontFamily: FONTS.bodySemi }}>
              {progress} · Score: {score}
            </Sub>
            <Card>
              <Sub style={{ color: th.primary, fontFamily: FONTS.bodySemi, marginBottom: 6 }}>
                {current.category}
              </Sub>
              <Text style={[styles.q, { color: th.text }]}>{current.q}</Text>
            </Card>
            {current.options.map((opt, i) => {
              const isAnswer = i === current.answer;
              const isPicked = i === picked;
              const revealed = picked !== null;
              const bg = !revealed
                ? th.chip
                : isAnswer
                  ? '#16A34A'
                  : isPicked
                    ? '#DC2626'
                    : th.chip;
              const fg = revealed && (isAnswer || isPicked) ? '#FFFFFF' : th.text;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => pick(i)}
                  disabled={revealed}
                  activeOpacity={0.8}
                  style={[styles.opt, { backgroundColor: bg }]}
                >
                  <Text style={[styles.optTxt, { color: fg }]}>
                    {isAnswer && revealed ? '✅ ' : isPicked ? '❌ ' : ''}
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {picked !== null ? (
              <>
                <Sub style={{ marginTop: 10, textAlign: 'center' }}>
                  {picked === current.answer
                    ? '🎉 Correct! MashaAllah.'
                    : `The correct answer was: ${current.options[current.answer]}`}
                </Sub>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton
                    label={idx + 1 >= questions.length ? 'See Result' : 'Next Question'}
                    onPress={next}
                  />
                </View>
              </>
            ) : null}
          </>
        ) : null}

        {phase === 'done' ? (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ fontSize: 56 }}>{score >= 8 ? '🏆' : score >= 5 ? '👏' : '📖'}</Text>
            <Text style={[styles.final, { color: th.text }]}>
              {score} / {questions.length}
            </Text>
            <Sub style={{ marginTop: 6, textAlign: 'center' }}>
              {score >= 8
                ? 'Excellent! MashaAllah, great knowledge.'
                : score >= 5
                  ? 'Good effort! Keep learning.'
                  : 'Keep studying — try again to improve!'}
            </Sub>
            {score >= best && score > 0 ? (
              <Sub style={{ marginTop: 8, color: th.primary, fontFamily: FONTS.bodySemi }}>
                🎉 New best score!
              </Sub>
            ) : (
              <Sub style={{ marginTop: 8 }}>Best: {best} / {ROUND_SIZE}</Sub>
            )}
            <View style={{ width: '100%', marginTop: 18, gap: 10 }}>
              <PrimaryButton label="Play Again" onPress={start} />
            </View>
          </Card>
        ) : null}
        <AdBanner />
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  q: { fontSize: 17, fontFamily: FONTS.bodySemi, lineHeight: 25 },
  opt: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginTop: 10 },
  optTxt: { fontSize: 15, fontFamily: FONTS.body },
  final: { fontSize: 44, fontFamily: FONTS.bodyBold, marginTop: 10, fontVariant: ['tabular-nums'] },
});
