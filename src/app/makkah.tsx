import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Screen, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';

// Makkah live via official YouTube embed — YouTube bears the bandwidth (zero cost to us).
// NOTE: stream availability depends on the broadcaster; we degrade gracefully.
const EMBED_URL = 'https://www.youtube.com/embed/live_stream?channel=UCxw0Qa5y8s7Zx0vR6y3Z9&autoplay=1';

export default function Makkah() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <Screen>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Title>🕋 {t('makkahLive', lang)}</Title>
        <Sub>Live from Makkah — streamed by YouTube (their bandwidth, free for us).</Sub>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        {failed ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>🕋</Text>
            <Sub style={{ textAlign: 'center', marginTop: 12 }}>
              The live stream is unavailable right now. Please try again later.
            </Sub>
            <TouchableOpacity
              style={[styles.retry, { backgroundColor: th.accent }]}
              onPress={() => { setFailed(false); setKey(k => k + 1); }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <WebView
            key={key}
            source={{ uri: EMBED_URL }}
            style={styles.web}
            allowsFullscreenVideo
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
          />
        )}
        <Sub style={{ marginTop: 8, textAlign: 'center' }}>
          Note: YouTube may show its own ads in the player.
        </Sub>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  retry: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 16 },
});
