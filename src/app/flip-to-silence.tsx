// Deen — Flip to Silence (Prayer Mode)
// Flip phone face-down to silence prayer notifications.
// Note: Works when app is open. For system-wide DND, use Android's
// built-in "Flip to Shhh" (Pixel) or DND schedule.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, SectionTitle, useTheme, TopBar } from '../components/ui';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'flipToSilence';

export default function FlipToSilence() {
  const th = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(v => setEnabled(v === '1'));
    let sub: { remove: () => void } | null = null;

    Accelerometer.isAvailableAsync().then(ok => {
      setAvailable(ok);
      if (!ok) return;
      Accelerometer.setUpdateInterval(500);
      sub = Accelerometer.addListener(({ z }) => {
        // Face-down: z ≈ -1 (screen facing table)
        setIsFaceDown(z < -0.85);
      });
    });

    return () => sub?.remove();
  }, []);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    await AsyncStorage.setItem(STORE_KEY, v ? '1' : '0');
  };

  return (
    <Screen edges={['top']}>
      <TopBar title="📵 Flip to Silence" onBack={() => router.back()} />
      <Scroller>
        {/* Status */}
        <Card style={[styles.statusCard, {
          backgroundColor: isFaceDown ? th.primary : th.accentSoft,
        }]}>
          <Text style={styles.statusEmoji}>{isFaceDown ? '📵' : '📱'}</Text>
          <Text style={[styles.statusText, { color: isFaceDown ? '#FFF' : th.text }]}>
            {isFaceDown
              ? 'Phone is face-down — Prayer Mode active'
              : 'Phone is face-up'}
          </Text>
          {isFaceDown && enabled && (
            <Sub style={{ color: '#FFF', textAlign: 'center', marginTop: 8 }}>
              Notifications silenced. Focus on your salah. 🤲
            </Sub>
          )}
        </Card>

        {/* Toggle */}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: th.text }]}>Flip to Silence</Text>
              <Sub>Flip phone face-down during prayer to mute notifications</Sub>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ false: th.border, true: th.primary }}
            />
          </View>
        </Card>

        {/* How it works */}
        <SectionTitle>How It Works</SectionTitle>
        <Card>
          <View style={styles.step}>
            <Text style={styles.stepNum}>1️⃣</Text>
            <Text style={[styles.stepText, { color: th.text }]}>
              Enable Flip to Silence above
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>2️⃣</Text>
            <Text style={[styles.stepText, { color: th.text }]}>
              When prayer time comes, flip your phone face-down
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>3️⃣</Text>
            <Text style={[styles.stepText, { color: th.text }]}>
              App detects it and silences prayer notifications
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>4️⃣</Text>
            <Text style={[styles.stepText, { color: th.text }]}>
              Pick up your phone to return to normal
            </Text>
          </View>
        </Card>

        {/* Note */}
        <Card>
          <Sub style={{ fontSize: 13 }}>
            📝 <Text style={{ fontFamily: FONTS.bodySemi }}>Note:</Text> This works when the Deen
            app is open. For system-wide silencing, use your phone's Do Not Disturb schedule
            (Settings → Sound → Do Not Disturb) aligned with prayer times.
          </Sub>
          {!available && (
            <Sub style={{ marginTop: 8, color: th.accent }}>
              ⚠️ Accelerometer not available on this device.
            </Sub>
          )}
        </Card>

        {/* Tip */}
        <Card style={[styles.tipCard, { backgroundColor: th.accentSoft }]}>
          <Text style={[styles.tipText, { color: th.text }]}>
            💡 <Text style={{ fontFamily: FONTS.bodySemi }}>Tip:</Text> Combine with Pre-Adhan
            Reminders — get reminded 10 min before, then flip to silence and pray peacefully.
          </Text>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: { padding: 24, borderRadius: 16, alignItems: 'center' },
  statusEmoji: { fontSize: 48, marginBottom: 12 },
  statusText: { fontSize: 16, fontFamily: FONTS.bodySemi, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 16, fontFamily: FONTS.bodySemi, marginBottom: 4 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { fontSize: 20 },
  stepText: { fontSize: 14, flex: 1, lineHeight: 20 },
  tipCard: { padding: 16, borderRadius: 12 },
  tipText: { fontSize: 14, lineHeight: 20 },
});
