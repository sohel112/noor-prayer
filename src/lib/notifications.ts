// Local prayer notifications — scheduled fully on-device.
// Respects per-prayer toggles and quiet hours. No server involved.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes } from './prayerTimes';
import { Settings } from './settings';
import { DAILY_DUAS } from '../data/dailyDuas';

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
    ]);
  } catch { /* categories are best-effort */ }

  // Android: create dedicated channels with custom azan sounds.
  // Channel sound is IMMUTABLE once created — so we use separate channels
  // per sound. The notification's `sound` field is IGNORED on Android when
  // a channelId is set; the channel's sound is what actually plays.
  if (Platform.OS === 'android') {
    try {
      // Clean up legacy channels (they had wrong/no sound).
      // NOTE: Android channels are IMMUTABLE — sound can't be changed after
      // creation. We delete ALL old channel IDs so they get recreated fresh.
      // v2 channels are used going forward (see getAzanChannelId).
      for (const old of [
        'prayer-azan', 'prayer-azan-v1', 'prayer-azan-v2',
        'prayer-azan-s1', 'prayer-azan-s2',
      ]) {
        try { await Notifications.deleteNotificationChannelAsync(old); } catch { /* ignore */ }
      }
      // Channel for azan1 (default) — v2 ID ensures fresh creation.
      await Notifications.setNotificationChannelAsync('prayer-azan-s1-v2', {
        name: 'Prayer Azan',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'azan', // res/raw/azan.ogg (no extension)
        vibrationPattern: [0, 500, 200, 500],
        enableVibrate: true,
        showBadge: false,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });
      // Channel for azan2 — v2 ID ensures fresh creation.
      await Notifications.setNotificationChannelAsync('prayer-azan-s2-v2', {
        name: 'Prayer Azan (Alt)',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'azan2', // res/raw/azan2.ogg (no extension)
        vibrationPattern: [0, 500, 200, 500],
        enableVibrate: true,
        showBadge: false,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });
      console.log('[azan] notification channels created (s1, s2)');
    } catch (e) {
      console.warn('[azan] channel setup failed:', e);
    }
  }
}

/** Get the Android channel ID matching the user's azan sound setting. */
export function getAzanChannelId(azanSound: string): string {
  // v2: bumped to force fresh channel creation (old channels had no/wrong sound
  // and Android channels are immutable).
  if (azanSound === 'azan2') return 'prayer-azan-s2-v2';
  return 'prayer-azan-s1-v2'; // default 'azan'
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

//**
 * Check + request the "Alarms & reminders" exact-alarm permission (Android 12+).
 * Without this, prayer notifications fall back to inexact alarms and can arrive
 * MINUTES LATE (Doze mode). Returns true if exact alarms are allowed.
 * If not allowed, opens the system settings screen so the user can grant it.
 */
export async function ensureExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IntentLauncher = require('expo-intent-launcher');
    // Check via native AlarmManager — expo doesn't expose this, so we try
    // scheduling a test via canScheduleExactAlarms if available.
    let canSchedule = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AlarmManager } = require('expo-notifications');
      if (AlarmManager && typeof AlarmManager.canScheduleExactAlarms === 'function') {
        canSchedule = await AlarmManager.canScheduleExactAlarms();
      }
    } catch { /* module may not expose it */ }
    if (canSchedule) return true;
    // Not granted (or unknown) — open the exact-alarm settings screen.
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
      { data: 'package:com.noor.prayer' },
    );
    return false;
  } catch {
    return false;
  }
}

**
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
            // iOS: sound name plays from bundle. Android: channel controls the
            // sound (channelId is set on the trigger below).
            sound: Platform.OS === 'ios'
              ? (silent && !forceWake ? undefined : (settings.azanSound === 'azan2' ? 'azan2' : 'azan'))
              : undefined,
            categoryIdentifier: 'prayer-azan',
            // Payload lets the app auto-play azan when the notification is tapped.
            data: { kind: 'prayer-azan', prayer: key, playAzan: !silent || forceWake, forceWake },
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            // Android: channelId MUST be on the trigger (per Expo SDK 57 docs).
            // The channel's baked-in sound is what actually plays.
            ...(Platform.OS === 'android' && !silent
              ? { channelId: getAzanChannelId(settings.azanSound) }
              : {}),
          },
        });

        // Pre-Adhan reminder (configurable: 5/10/15 min before, 0 = off)
        const preMins = settings.preAdhanMinutes || 0;
        if (preMins > 0) {
          const remindAt = new Date(at.getTime() - preMins * 60000);
          if (remindAt.getTime() > Date.now() + 60000) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `⏳ ${PRAYER_LABELS[key]} in ${preMins} minutes`,
                body: 'Get ready for prayer. Make wudu.',
                data: { kind: 'prayer-reminder', prayer: key },
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
            });
          }
        }
        // Legacy 15-min toggle (kept for backward compat)
        if (settings.notifications['reminder15'] && preMins === 0) {
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
    // Dua of the Day — scheduled after the cancel-all above so it survives.
    await scheduleDuaOfDay();
  } catch {
    // notifications unavailable — app keeps working
  }
}

/**
 * Dua of the Day: a daily 8:00 AM notification with a dua that rotates
 * by day-of-year through 30 short duas. Zero cost, fully on-device.
 */
export async function scheduleDuaOfDay(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const dua = DAILY_DUAS[dayOfYear % DAILY_DUAS.length];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🤲 Dua of the Day',
        body: `${dua.en} (${dua.ref})`,
        data: { kind: 'dua-of-day', ar: dua.ar, ref: dua.ref },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
      identifier: 'noor-dua-of-day',
    });
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
