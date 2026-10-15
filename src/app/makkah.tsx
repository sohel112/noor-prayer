// Makkah Live — YouTube embed (YouTube bears the bandwidth, zero cost to us).
// Error 153 (embedding disabled) is common on live streams and often does NOT
// trigger onError, so we combine three strategies:
//   1. youtube-nocookie embed + desktop Chrome user-agent (bypasses many restrictions)
//   2. onError / onHttpError → auto-advance to the next stream
//   3. a 12-second "loaded?" timeout → auto-advance if onLoad never fired
// If every stream fails, a clean fallback offers opening the stream in the YouTube app.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Screen, Card, Title, Sub, useTheme, PrimaryButton } from '../components/ui';
import { useSettings } from '../lib/settings';
import { FONTS } from '../lib/theme';
import { t } from '../lib/i18n';
import { AdBanner } from '../components/AdBanner';

// Desktop Chrome UA — often bypasses the mobile-embed restrictions (Error 153).
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Multiple known Makkah live streams; embedding status changes over time.
// These can be updated remotely without an app release: the app first tries
// to fetch a fresh list from the config URL below, falling back to this
// hardcoded list if the fetch fails (offline, etc.).
const REMOTE_STREAMS_URL =
  'https://raw.githubusercontent.com/sohel112/noor-prayer/main/streams.json';

const FALLBACK_STREAMS = [
  { id: 'eC4LfEVxvKg', label: 'Stream 1' },
  { id: 'd8i86SvFhJI', label: 'Stream 2' },
  { id: 'Lwf0Lpt5IpQ', label: 'Stream 3' },
  { id: 'JJcM9ZcJmzg', label: 'Stream 4' },
];

const LOAD_TIMEOUT_MS = 12000;

export default function Makkah() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;

  const [streamIdx, setStreamIdx] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webKey, setWebKey] = useState(0);
  const [streams, setStreams] = useState(FALLBACK_STREAMS);
  const loadedRef = useRef(false);

  // Try to fetch a fresh stream list remotely (no app update needed to
  // change streams). Falls back to the hardcoded list on any failure.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REMOTE_STREAMS_URL);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json) && json.length > 0 &&
            json.every((s: any) => typeof s?.id === 'string')) {
          setStreams(json.map((s: any, i: number) => ({
            id: s.id, label: s.label ?? `Stream ${i + 1}`,
          })));
          setStreamIdx(0);
        }
      } catch { /* offline or bad JSON — keep fallback list */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const current = streams[streamIdx] ?? FALLBACK_STREAMS[0];
  const embedUrl = `https://www.youtube-nocookie.com/embed/${current.id}?rel=0&autoplay=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${current.id}`;

  const tryNext = useCallback(() => {
    loadedRef.current = false;
    if (streamIdx + 1 < streams.length) {
      setLoading(true);
      setStreamIdx(streamIdx + 1);
    } else {
      setLoading(false);
      setExhausted(true);
    }
  }, [streamIdx, streams.length]);

  // 12s watchdog: Error 153 often never fires onError — if the player hasn't
  // loaded by then, move on to the next stream.
  useEffect(() => {
    if (exhausted) return;
    const id = setTimeout(() => {
      if (!loadedRef.current) tryNext();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [streamIdx, webKey, exhausted, tryNext]);

  const handleLoad = () => {
    loadedRef.current = true;
    setLoading(false);
  };

  const retryAll = () => {
    setStreamIdx(0);
    setExhausted(false);
    setLoading(true);
    setWebKey(k => k + 1);
  };

  const openInYouTube = () => {
    Linking.openURL(watchUrl).catch(() => {});
  };

  return (
    <Screen>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Title>🕋 {t('makkahLive', lang)}</Title>
        <Sub>Live from Makkah — streamed by YouTube (their bandwidth, free for us).</Sub>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {exhausted ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 52 }}>🕋</Text>
            <Text style={{
              color: th.text, fontSize: 18, fontFamily: FONTS.bodySemi,
              marginTop: 14, textAlign: 'center',
            }}>
              Stream unavailable in-app
            </Text>
            <Sub style={{ textAlign: 'center', marginTop: 8 }}>
              YouTube has blocked in-app playback for these streams right now.
              You can still watch live in the YouTube app:
            </Sub>
            <View style={{ width: '100%', marginTop: 18, gap: 10 }}>
              <PrimaryButton label="▶ Watch in YouTube app" onPress={openInYouTube} />
              <TouchableOpacity
                onPress={retryAll}
                activeOpacity={0.8}
                style={[styles.secondary, { borderColor: th.border }]}
              >
                <Text style={{ color: th.text, fontFamily: FONTS.bodySemi, fontSize: 15 }}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.playerWrap}>
              <WebView
                key={`wv-${streamIdx}-${webKey}`}
                source={{
                  uri: embedUrl,
                  // Referer header helps bypass YouTube's Error 153 embed restrictions
                  headers: { Referer: 'https://www.youtube-nocookie.com/' },
                }}
                userAgent={DESKTOP_UA}
                style={styles.web}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                onLoad={handleLoad}
                onError={tryNext}
                onHttpError={tryNext}
              />
              {loading ? (
                <View style={[styles.loader, { backgroundColor: th.card }]}>
                  <ActivityIndicator size="large" color={th.primary} />
                  <Sub style={{ marginTop: 10, textAlign: 'center' }}>
                    Connecting to {current.label.toLowerCase()}…
                  </Sub>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={{ alignItems: 'center', marginTop: 12 }}
              onPress={tryNext}
              activeOpacity={0.7}
            >
              <Text style={{ color: th.primary, fontSize: 14, fontFamily: FONTS.bodySemi }}>
                Not loading? Try another stream ({streamIdx + 1}/{streams.length})
              </Text>
            </TouchableOpacity>
          </>
        )}
        <Sub style={{ marginTop: 10, textAlign: 'center' }}>
          Note: YouTube may show its own ads in the player.
        </Sub>
        <AdBanner />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 240,
  },
  web: { flex: 1 },
  loader: {
    ...(StyleSheet.absoluteFill as object),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  secondary: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
  },
});
