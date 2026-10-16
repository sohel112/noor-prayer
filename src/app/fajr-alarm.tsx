import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Screen, useTheme } from '../components/ui';
import { playAzan, stopAzan, type AzanId } from '../lib/azanPlayer';
import { useSettings } from '../lib/settings';

/**
 * Full-screen Fajr force-wake alarm.
 * Opened when the user taps a force-wake Fajr notification.
 * Plays the azan loudly (expo-audio is configured to play even in silent mode)
 * and vibrates until dismissed.
 */
export default function FajrAlarm() {
  const th = useTheme();
  const { settings } = useSettings();
  const [seconds, setSeconds] = useState(0);
  const azanId: AzanId = (settings.azanSound === 'azan2' || settings.azanSound === 'azan3') ? settings.azanSound as AzanId : 'azan1';

  useEffect(() => {
    // Start the alarm sound + vibration pattern.
    playAzan(azanId);
    // Vibrate in a repeating pattern (Android). iOS vibrates once per call.
    const vib = setInterval(() => {
      try { Vibration.vibrate([0, 800, 400, 800]); } catch { /* ignore */ }
    }, 2500);

    const tick = setInterval(() => setSeconds(s => s + 1), 1000);

    return () => {
      clearInterval(vib);
      clearInterval(tick);
      stopAzan();
      try { Vibration.cancel(); } catch { /* ignore */ }
    };
  }, []);

  const dismiss = () => {
    stopAzan();
    try { Vibration.cancel(); } catch { /* ignore */ }
    router.replace('/(tabs)');
  };

  const snooze = async () => {
    stopAzan();
    try { Vibration.cancel(); } catch { /* ignore */ }
    // Ring again in 10 minutes.
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ FAJR — WAKE UP (snoozed)',
          body: 'Tap to dismiss the Fajr alarm.',
          sound: 'default',
          data: { kind: 'prayer-azan', prayer: 'fajr', playAzan: true, forceWake: true },
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600 },
      });
    } catch { /* ignore */ }
    router.replace('/(tabs)');
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Screen>
      <View style={[styles.wrap, { backgroundColor: th.bg }]}>
        <Text style={styles.bell}>⏰</Text>
        <Text style={[styles.title, { color: th.accent }]}>FAJR</Text>
        <Text style={[styles.sub, { color: th.text }]}>Time to wake up for prayer</Text>
        <Text style={[styles.timer, { color: th.sub }]}>{mm}:{ss}</Text>

        <TouchableOpacity
          onPress={dismiss}
          style={[styles.dismiss, { backgroundColor: th.accent }]}
        >
          <Text style={[styles.dismissText, { color: th.onAccent }]}>Dismiss — I'm awake</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={snooze} style={[styles.snooze, { borderColor: th.border }]}>
          <Text style={[styles.snoozeText, { color: th.text }]}>Snooze 10 min</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bell: { fontSize: 72 },
  title: { fontSize: 52, fontWeight: '900', marginTop: 12, letterSpacing: 4 },
  sub: { fontSize: 18, marginTop: 8 },
  timer: { fontSize: 15, marginTop: 16, fontVariant: ['tabular-nums'] },
  dismiss: {
    borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48, marginTop: 48,
  },
  dismissText: { fontSize: 18, fontWeight: '800' },
  snooze: {
    borderRadius: 16, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 40, marginTop: 16,
  },
  snoozeText: { fontSize: 16, fontWeight: '600' },
});
