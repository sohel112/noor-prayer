// Local prayer notifications — scheduled fully on-device.
// Respects per-prayer toggles and quiet hours. No server involved.

import * as Notifications from 'expo-notifications';
import { PrayerTimes } from './prayerTimes';
import { Settings } from './settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

function inQuietHours(now: Date, from: string, to: string): boolean {
  const mins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const f = fh * 60 + fm, tt = th * 60 + tm;
  return f <= tt ? mins >= f && mins < tt : mins >= f || mins < tt;
}

/** Cancel all and reschedule today's + tomorrow's prayer alerts. Call after settings/location change. */
export async function reschedulePrayerNotifications(
  today: PrayerTimes,
  tomorrow: PrayerTimes,
  settings: Settings,
): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    const days: { times: PrayerTimes; date: Date }[] = [
      { times: today, date: new Date() },
      { times: tomorrow, date: new Date(Date.now() + 86400000) },
    ];

    for (const { times, date } of days) {
      for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
        if (!settings.notifications[key]) continue;
        const at = new Date(date);
        at.setHours(Math.floor(times[key]), Math.floor((times[key] % 1) * 60), 0, 0);
        if (at.getTime() < Date.now() + 60000) continue; // skip past
        if (inQuietHours(at, settings.quietFrom, settings.quietTo) && key !== 'fajr') continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${PRAYER_LABELS[key]} time`,
            body: settings.azanSound === 'silent'
              ? 'It is time for prayer.'
              : 'Time for prayer — tap to open Noor.',
            sound: settings.azanSound === 'silent' ? undefined : 'default',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
        });
      }
    }
  } catch {
    // notifications unavailable — app keeps working
  }
}
