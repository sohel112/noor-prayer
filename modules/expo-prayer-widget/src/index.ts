import { requireNativeModule } from 'expo-modules-core';

/**
 * Native Android home-screen widget bindings for the Deen prayer app.
 *
 * The widget (PrayerWidgetProvider) renders the snapshot JSON that
 * `refreshWidgetData()` (src/lib/widgetData.ts) writes to AsyncStorage.
 * Call `updateWidget()` right after refreshing the snapshot to re-render
 * every placed widget instance immediately.
 *
 * Usage:
 *   import { updateWidget, isPrayerWidgetAvailable } from 'expo-prayer-widget';
 *   import { refreshWidgetData } from '../lib/widgetData';
 *
 *   await refreshWidgetData(); // write fresh snapshot
 *   updateWidget();            // redraw widgets now (no-op if none placed)
 */

type ExpoPrayerWidgetModuleType = {
  /** Re-renders all placed widget instances. Returns true if at least one exists. */
  updateWidget(): boolean;
};

// Native module may be absent (e.g. Expo Go) — fail soft, not crash.
let ExpoPrayerWidgetModule: ExpoPrayerWidgetModuleType | null = null;
try {
  ExpoPrayerWidgetModule = requireNativeModule<ExpoPrayerWidgetModuleType>('ExpoPrayerWidget');
} catch {
  ExpoPrayerWidgetModule = null;
}

/** True only when the native widget module is actually linked into the app. */
export const isPrayerWidgetAvailable = ExpoPrayerWidgetModule !== null;

/**
 * Ask Android to re-render all home-screen widget instances right now.
 * No-op (returns false) when the native module is absent or no widget is placed.
 */
export function updateWidget(): boolean {
  try {
    return ExpoPrayerWidgetModule?.updateWidget() ?? false;
  } catch {
    return false;
  }
}
