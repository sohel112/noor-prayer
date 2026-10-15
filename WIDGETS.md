# Widgets — Noor

## Status (2026-10-14)

A real Android home-screen widget is **not feasible yet** in the Expo managed
workflow:

- `expo-widgets@57.0.24` (the official Expo package) ships Android support,
  but its Android implementation is a **stub**: `ExpoWidgetsGlanceWidget`
  renders only the widget's *name* as text — no real content, no timeline,
  no data binding. Real rendering only works on iOS.
- Verified by inspecting the package source
  (`android/.../ExpoWidgetsGlanceWidget.kt` → `provideContent { Text(widgetName) }`,
  and `WidgetsModule.kt` exposes no functions on Android).

Installing it anyway would put a broken-looking widget ("NoorPrayerWidget" as
plain text) in the user's widget picker — worse than no widget. So it is
**deliberately not installed**.

## What IS built (widget-ready)

`src/lib/widgetData.ts` — a widget-ready data provider:

- `buildWidgetSnapshot()` — computes the next prayer, live countdown text,
  today's formatted times, Hijri date, and location label, 100% on-device
  (same prayer engine as the app).
- `refreshWidgetData()` — rebuilds and persists the snapshot to AsyncStorage
  under the key **`noor.widget.v1`**.
- `readWidgetSnapshot()` — reads the last snapshot (what a widget renders).

On Android, AsyncStorage lives in the `RKStorage` SharedPreferences file
inside the app sandbox — any future native widget code (Glance, or a later
expo-widgets with real Android rendering) can read `noor.widget.v1` from
there without new permissions.

## Wiring (for the parent agent — needs existing files)

Call `refreshWidgetData()` whenever prayer-relevant state changes:

1. App foreground / home screen mount — `src/app/(tabs)/index.tsx`
2. After location is saved — `src/lib/location.ts` (`save()`)
3. After method/settings change — `src/lib/settings.tsx` (`update()`)
4. When prayer notifications are (re)scheduled — `src/lib/notifications.ts`

Each call is cheap (pure math + one AsyncStorage write).

## Path forward

- **Best case:** a future `expo-widgets` version implements real Android
  Glance rendering. Then: `npx expo install expo-widgets`, add the config
  plugin entry, create `widgets/prayer-widget.tsx` with the `'widget'`
  directive, and feed it via `Widget.updateTimeline()` built from
  `buildWidgetSnapshot()`.
- **Alternative:** a small custom config plugin + native Glance widget that
  reads `noor.widget.v1` directly (needs a development build, not Expo Go).

## Promise kept

The widget is **free forever** — no premium gating, unlike competitors that
moved widgets behind paywalls. When the platform allows it, the widget
ships free on day one.
