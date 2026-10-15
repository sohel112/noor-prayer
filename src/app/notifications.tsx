// Notifications preferences — each toggle persisted to AsyncStorage ('notifPrefs' JSON).
import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ExpoNotifications from 'expo-notifications';
import { Screen, Scroller, Card, Sub, ToggleRow, TopBar, PrimaryButton, SectionTitle } from '../components/ui';
import { getJSON, setJSON } from '../lib/storage';
import { getAzanChannelId, setupNotificationCategories } from '../lib/notifications';
import { useSettings } from '../lib/settings';

interface NotifPrefs {
  prayerAlerts: boolean;
  adhan: boolean;
  dailyReminder: boolean;
  quranReminder: boolean;
  islamicEvents: boolean;
  locationServices: boolean;
}

const DEFAULTS: NotifPrefs = {
  prayerAlerts: true,
  adhan: true,
  dailyReminder: true,
  quranReminder: true,
  islamicEvents: true,
  locationServices: false,
};

const ROWS: { key: keyof NotifPrefs; label: string; hint: string; icon: string }[] = [
  { key: 'prayerAlerts', label: 'Prayer Time Alerts', hint: 'Get notified when each prayer time begins', icon: '🔔' },
  { key: 'adhan', label: 'Adhan Notification', hint: 'Play the adhan sound with prayer alerts', icon: '📢' },
  { key: 'dailyReminder', label: 'Daily Reminder', hint: 'A gentle morning reminder to open DEEN', icon: '🌅' },
  { key: 'quranReminder', label: 'Quran Reading Reminder', hint: 'Daily nudge to continue your reading', icon: '📖' },
  { key: 'islamicEvents', label: 'Islamic Events', hint: 'Ramadan, Eid and other important dates', icon: '🌙' },
  { key: 'locationServices', label: 'Location Services', hint: 'Use location for accurate prayer times', icon: '📍' },
];

export default function Notifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [channels, setChannels] = useState<any[]>([]);
  const [testStatus, setTestStatus] = useState<string>('');
  const { settings } = useSettings();

  useEffect(() => {
    getJSON<NotifPrefs>('notifPrefs', DEFAULTS).then(saved => {
      setPrefs({ ...DEFAULTS, ...saved });
    });
    loadChannels();
  }, []);

  const loadChannels = async () => {
    if (Platform.OS !== 'android') return;
    try {
      await setupNotificationCategories();
      const list = await ExpoNotifications.getNotificationChannelsAsync();
      setChannels(list ?? []);
    } catch (e) {
      setTestStatus('Channel load failed: ' + String(e));
    }
  };

  const testAzan = async () => {
    setTestStatus('Scheduling test azan in 10 seconds...');
    try {
      const channelId = getAzanChannelId(settings.azanSound);
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: '🕌 TEST AZAN',
          body: 'If you hear azan sound, it works!',
          data: { kind: 'test-azan' },
          priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
      });
      setTestStatus(`Test scheduled! Channel: ${channelId}. Wait 10 sec — app ko background me rakho.`);
    } catch (e) {
      setTestStatus('Test failed: ' + String(e));
    }
  };

  const set = (key: keyof NotifPrefs, value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      setJSON('notifPrefs', next);
      return next;
    });
  };

  return (
    <Screen>
      <TopBar title="Notifications" onBack={() => router.back()} />
      <Scroller>
        <SectionTitle>Notification preferences</SectionTitle>
        <Card style={{ padding: 4, paddingHorizontal: 14 }}>
          {ROWS.map(r => (
            <ToggleRow
              key={r.key}
              label={r.label}
              hint={r.hint}
              icon={r.icon}
              value={prefs[r.key]}
              onChange={v => set(r.key, v)}
            />
          ))}
        </Card>

        <Card>
          <SectionTitle>🔊 Azan Sound Test</SectionTitle>
          <Sub>
            Ye diagnostic batayega ki azan channel sahi bana hai ya nahi.
          </Sub>
          {channels.map(c => (
            <View key={c.id} style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
              <Sub>Channel: {c.id}</Sub>
              <Sub>Sound: {c.sound ?? 'DEFAULT (koi custom sound nahi!)'}</Sub>
              <Sub>Importance: {c.importance}</Sub>
            </View>
          ))}
          {testStatus ? <View style={{ marginTop: 8 }}><Sub>{testStatus}</Sub></View> : null}
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            <PrimaryButton label="Refresh Channels" onPress={loadChannels} />
          </View>
          <View style={{ marginTop: 8 }}>
            <PrimaryButton label="🔊 Test Azan (10 sec)" onPress={testAzan} />
          </View>
        </Card>

        <Card>
          <SectionTitle>Set your prayer time notification</SectionTitle>
          <Sub>
            Prayer alerts follow your calculation method and location. Choose the method and
            fine-tune minute adjustments in Prayer Times settings.
          </Sub>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton label="Open Prayer Times Settings" onPress={() => router.push('/settings' as any)} />
          </View>
        </Card>
      </Scroller>
    </Screen>
  );
}
