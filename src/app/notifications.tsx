// Notifications preferences — each toggle persisted to AsyncStorage ('notifPrefs' JSON).
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Sub, ToggleRow, TopBar, PrimaryButton, SectionTitle } from '../components/ui';
import { getJSON, setJSON } from '../lib/storage';

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

  useEffect(() => {
    getJSON<NotifPrefs>('notifPrefs', DEFAULTS).then(saved => {
      setPrefs({ ...DEFAULTS, ...saved });
    });
  }, []);

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
