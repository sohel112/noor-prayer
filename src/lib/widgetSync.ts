/**
 * Widget sync — keeps the Android home-screen widget fresh.
 *
 * Call syncPrayerWidget() whenever prayer-relevant state changes:
 * app foreground, location change, settings change, notification reschedule.
 *
 * It refreshes the snapshot JSON (src/lib/widgetData.ts) then asks the
 * native widget to re-render immediately (expo-prayer-widget).
 * Fail-soft: never throws, safe to call from anywhere.
 */
import { refreshWidgetData } from './widgetData';
import { updateWidget } from 'expo-prayer-widget';

let lastSync = 0;
const MIN_INTERVAL_MS = 30_000; // don't hammer native side more than 1x/30s

export async function syncPrayerWidget(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSync < MIN_INTERVAL_MS) return;
  lastSync = now;
  try {
    const snap = await refreshWidgetData();
    if (snap) updateWidget();
  } catch {
    // widget is best-effort — never break the app for it
  }
}
