import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Screen, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { getJSON, setJSON } from '../lib/storage';
import { FONTS } from '../lib/theme';

const STORE_KEY = 'fajrAlarm' as const;

interface FajrAlarmConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULTS: FajrAlarmConfig = { enabled: false, hour: 5, minute: 0 };

function fmt(h: number, m: number, use24h: boolean): string {
  if (use24h) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export default function FajrAlarmSettings() {
  const th = useTheme();
  const { settings } = useSettings();
  const [cfg, setCfg] = useState<FajrAlarmConfig>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getJSON<FajrAlarmConfig | null>(STORE_KEY, null);
      if (saved) setCfg({ ...DEFAULTS, ...saved });
      setLoaded(true);
    })();
  }, []);

  const save = async (next: FajrAlarmConfig) => {
    setCfg(next);
    await setJSON(STORE_KEY, next);
    await reschedule(next);
  };

  const reschedule = async (c: FajrAlarmConfig) => {
    // Cancel any previously scheduled fajr force-wake alarms.
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of all) {
        if ((n.content.data as any)?.kind === 'fajr-force-wake') {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } catch { /* ignore */ }

    if (!c.enabled) return;

    // Schedule a daily repeating alarm at the chosen time.
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ FAJR — WAKE UP',
          body: 'Tap to open the Fajr alarm.',
          sound: 'default',
          data: { kind: 'fajr-force-wake' },
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: c.hour,
          minute: c.minute,
        } as any,
      });
    } catch (e) {
      Alert.alert('Alarm failed', 'Could not schedule the alarm. Please check notification permissions.');
    }
  };

  const bump = (field: 'hour' | 'minute', delta: number) => {
    const next = { ...cfg, enabled: true };
    if (field === 'hour') next.hour = (next.hour + delta + 24) % 24;
    else next.minute = (next.minute + delta + 60) % 60;
    save(next);
  };

  const Stepper = ({ field, value, max }: { field: 'hour' | 'minute'; value: number; max: number }) => (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={() => bump(field, 1)} style={[styles.stepBtn, { borderColor: th.border }]} activeOpacity={0.7}>
        <Text style={[styles.stepTxt, { color: th.primary }]}>▲</Text>
      </TouchableOpacity>
      <Text style={[styles.stepVal, { color: th.text }]}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity onPress={() => bump(field, -1)} style={[styles.stepBtn, { borderColor: th.border }]} activeOpacity={0.7}>
        <Text style={[styles.stepTxt, { color: th.primary }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  if (!loaded) return <Screen><View /></Screen>;

  return (
    <Screen>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Title>⏰ Fajr Alarm</Title>
        <Sub>Wake up on time — the azan will play when the alarm rings.</Sub>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: th.text }]}>Alarm enabled</Text>
              <Sub>Daily at {fmt(cfg.hour, cfg.minute, settings.use24h)}</Sub>
            </View>
            <Switch
              value={cfg.enabled}
              onValueChange={v => save({ ...cfg, enabled: v })}
              trackColor={{ true: th.primary }}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.label, { color: th.text, marginBottom: 12 }]}>Alarm time</Text>
          <View style={styles.timeRow}>
            <Stepper field="hour" value={cfg.hour} max={24} />
            <Text style={[styles.colon, { color: th.sub }]}>:</Text>
            <Stepper field="minute" value={cfg.minute} max={60} />
          </View>
          <Text style={[styles.preview, { color: th.primary }]}>
            {fmt(cfg.hour, cfg.minute, settings.use24h)}
          </Text>
        </Card>

        <Sub style={{ textAlign: 'center', marginTop: 4 }}>
          When the alarm rings, tap the notification — the full-screen alarm will open and play the azan until you dismiss it.
        </Sub>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, fontFamily: FONTS.bodySemi },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  colon: { fontSize: 32, fontFamily: FONTS.heading },
  preview: { fontSize: 22, fontFamily: FONTS.heading, textAlign: 'center', marginTop: 12, fontVariant: ['tabular-nums'] },
  stepper: { alignItems: 'center', gap: 6 },
  stepBtn: {
    borderRadius: 12, borderWidth: 1.5, width: 64, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  stepTxt: { fontSize: 16 },
  stepVal: { fontSize: 30, fontFamily: FONTS.heading, fontVariant: ['tabular-nums'] },
});
