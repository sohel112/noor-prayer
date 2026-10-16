# expo-prayer-widget — Setup & How It Works

Native Android home-screen widget for the Deen app. Shows the **next prayer
name**, a **live countdown**, and the **Hijri date**. Zero APK-size cost
beyond a few KB of native code — no new runtime dependencies.

## Architecture

```
JS (React Native)                          Android (native)
─────────────────                          ─────────────────
refreshWidgetData()                        PrayerWidgetProvider
  (src/lib/widgetData.ts)                    (AppWidgetProvider)
  writes snapshot JSON ──► AsyncStorage ──► reads snapshot JSON
  key: "noor.widget.v1"    "RKStorage"      renders RemoteViews
                                                 widget_prayer.xml
updateWidget()
  (this module)
  broadcasts APPWIDGET_UPDATE ──────────► onUpdate() redraws now
```

**Data flow:** JS computes prayer times (it already does for notifications),
writes a small JSON snapshot, then calls `updateWidget()` so every placed
widget instance redraws immediately. Android also refreshes the widget every
30 minutes via `updatePeriodMillis` as a fallback.

**Snapshot JSON shape** (written by `refreshWidgetData()`):

```json
{
  "nextPrayerName": "maghrib",
  "nextPrayerAt": "2026-10-16T13:20:00.000Z",
  "countdownText": "02:34:15",
  "hijriDate": "24 Rabiʿ al-Thani 1447H",
  "timesToday": { "fajr": "05:12", ... },
  "locationLabel": "Bhopal",
  "updatedAt": "2026-10-16T10:46:00.000Z"
}
```

## Reading the snapshot natively

`@react-native-async-storage/async-storage` on Android persists into a store
named `RKStorage`. Two layouts exist across versions, so the provider tries
both:

1. **SharedPreferences** file `"RKStorage"`, string key `"noor.widget.v1"`
   (legacy layout).
2. **SQLite** database `"RKStorage"`, table `catalystLocalStorage`
   (`SELECT value FROM catalystLocalStorage WHERE key = 'noor.widget.v1'`)
   (current layout).

If neither has data (e.g. app never opened), the widget shows
"Deen / --:--:-- / Open the app to set up prayer times", and tapping it
launches the app.

The countdown is **recomputed at each update** from `nextPrayerAt`
(fresh `HH:MM:SS`); `countdownText` is only a fallback if the timestamp is
missing or unparseable.

## Wiring it up (JS side — not done yet)

In the app (e.g. alongside notification rescheduling in Home):

```ts
import { refreshWidgetData } from './src/lib/widgetData';
import { updateWidget } from 'expo-prayer-widget';

// whenever prayer times / location / settings change:
await refreshWidgetData();
updateWidget(); // no-op if native module absent or no widget placed
```

`updateWidget()` and the import are both safe in Expo Go — they no-op when
the native module isn't linked.

## Manifest

The module's `AndroidManifest.xml` is merged automatically and registers
`PrayerWidgetProvider` for `APPWIDGET_UPDATE` with
`@xml/prayer_widget_info` (250×110dp, 30-min updates, home_screen only).

## Adding the widget on a device

Long-press home screen → Widgets → find **Deen Prayer** → drag to home
screen. It appears after a build that includes this module (dev builds
qualify; Expo Go does not include custom native modules).

## Testing checklist

1. `npx tsc --noEmit` passes.
2. Fresh dev build installs; widget appears in the widget picker.
3. Place widget → shows real next prayer + countdown + Hijri date
   (after opening the app once so the snapshot exists).
4. Change location/settings → widget refreshes on next app foreground
   (once JS wiring calls `refreshWidgetData()` + `updateWidget()`).
5. Reboot → widget still renders (reads persisted snapshot).

## Limitations (honest)

- The countdown ticks only when the widget updates (on `updateWidget()`
  calls + every 30 min via `updatePeriodMillis`). Android throttles widget
  updates, so per-second ticking is not possible without a foreground
  service — the 30-min cadence plus refresh-on-app-foreground keeps it
  accurate enough for prayer countdowns.
- Android 12+ widget picker may require the app to be opened once before
  the widget is listed.
- iOS: not implemented (this module is Android-only, like expo-inmobi).
