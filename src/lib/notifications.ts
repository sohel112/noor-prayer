// Local prayer notifications — scheduled fully on-device.
// Respects per-prayer toggles and quiet hours. No server involved.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/** Notification category with a "Play azan" action button. */
export async function setupNotificationCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync('prayer-azan', [
      { identifier: 'PLAY_AZAN', buttonTitle: '🔊 Play azan', options: { opensAppToForeground: true } },
      { identifier: 'DISMISS', buttonTitle: 'Dismiss', options: { opensAppToForeground: false } },
    ]);
  } catch {
    // categories unsupported — notifications still work without actions
  }
}

/**
 * Request notification permission in-app (1 tap). Returns true if granted.
 * On Android 12+, exact-alarm scheduling needs the special "Alarms & reminders"
 * access — the manifest already declares SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  try {
    await setupNotificationCategories();
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Current permission status without prompting. */
export async function getNotificationPermissionStatus(): Promise<string> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

/**
 * 1-tap shortcut to the system's battery-optimization exemption screen for
 * this app (Android). This is the single most effective fix for missed azans
 * on Xiaomi/Samsung/Oppo/Vivo — no deep guide needed.
 */
export async function requestBatteryExemption(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // Lazy require so iOS bundles never touch the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IntentLauncher = require('expo-intent-launcher');
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: 'package:com.noor.prayer' },
    );
    return true;
  } catch {
    return false;
  }
}

function inQuietHours(now: Date, from: string, to: string): boolean {
  const mins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const f = fh * 60 + fm, tt = th * 60 + tm;
  return f <= tt ? mins >= f && mins < tt : mins >= f || mins < tt;
}

function prayerDate(base: Date, fracHours: number): Date {
  const at = new Date(base);
  at.setHours(Math.floor(fracHours), Math.floor((fracHours % 1) * 60), 0, 0);
  return at;
}

/** Cancel all and reschedule today's + tomorrow's prayer alerts. Call after settings/location change. */
export async function reschedulePrayerNotifications(
  today: PrayerTimes,
  tomorrow: PrayerTimes,
  settings: Settings,
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await setupNotificationCategories();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const days: { times: PrayerTimes; date: Date }[] = [
      { times: today, date: new Date() },
      { times: tomorrow, date: new Date(Date.now() + 86400000) },
    ];

    for (const { times, date } of days) {
      for (const key of PRAYER_KEYS) {
        if (!settings.notifications[key]) continue;
        const at = prayerDate(date, times[key]);
        if (at.getTime() < Date.now() + 60000) continue; // skip past
        if (inQuietHours(at, settings.quietFrom, settings.quietTo) && key !== 'fajr') continue;
        const silent = settings.azanSound === 'silent';
        // Fajr force-wake: loud alarm even on silent — data flag triggers the
        // full-screen alarm UI when the notification is tapped / app opened.
        const forceWake = key === 'fajr' && !!settings.fajrForceWake;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: forceWake ? `⏰ FAJR — WAKE UP` : `🕌 ${PRAYER_LABELS[key]} — time for prayer`,
            body: forceWake
              ? 'Tap to dismiss the Fajr alarm.'
              : silent
                ? 'It is time for prayer.'
                : 'Tap to open Deen — azan will play.',
            sound: silent && !forceWake ? undefined : 'default',
            categoryIdentifier: 'prayer-azan',
            // Payload lets the app auto-play azan when the notification is tapped.
            data: { kind: 'prayer-azan', prayer: key, playAzan: !silent || forceWake, forceWake },
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
        });

        // Optional 15-minute heads-up reminder (toggle: settings.notifications.reminder15)
        if (settings.notifications['reminder15']) {
          const remindAt = new Date(at.getTime() - 15 * 60000);
          if (remindAt.getTime() > Date.now() + 60000) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `⏳ ${PRAYER_LABELS[key]} in 15 minutes`,
                body: 'Get ready for prayer.',
                data: { kind: 'prayer-reminder', prayer: key },
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
            });
          }
        }
      }
    }
  } catch {
    // notifications unavailable — app keeps working
  }
}

/**
 * Countdown helper (bonus): show/update an immediate notification like
 * "Maghrib me 45 min baaki". Call every ~15 min while the app is open;
 * true background persistence needs a foreground service (not used here).
 */
export async function presentCountdownNotification(
  prayerName: string,
  minutesLeft: number,
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    // Remove the previous countdown so the tray never fills up.
    try {
      await Notifications.dismissNotificationAsync('noor-countdown');
    } catch {
      // nothing to dismiss
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏳ ${prayerName} in ${minutesLeft} min`,
        body: 'Deen — prayer countdown',
        data: { kind: 'countdown', sticky: true },
        autoDismiss: true,
      },
      trigger: null, // show immediately
      identifier: 'noor-countdown',
    });
  } catch {
    // ignore
  }
}
