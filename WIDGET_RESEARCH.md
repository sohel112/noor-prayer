# Home Screen Widget — Feasibility Research (Android)

Date: 2026-10-15 · Project: Deen (Expo SDK 57, managed workflow, EAS build, no android/ios dirs)

## Verdict: FEASIBLE, but medium-high effort (est. 4–7 days)

Android home-screen widgets are technically possible in this Expo managed project
without ejecting. Nothing about the EAS/managed setup blocks it — config plugins
run at `prebuild` time and can inject all required native pieces.

## What an Android widget requires natively

1. An `AppWidgetProvider` (a `BroadcastReceiver` subclass) declared in
   `AndroidManifest.xml`
2. A widget metadata XML (`appwidget-provider`) — size, update period, preview
3. A layout rendered via `RemoteViews` (restricted view set: TextView,
   ImageView, LinearLayout, etc. — no WebView, no custom views)
4. A mechanism to push updated `RemoteViews` (AlarmManager / WorkManager /
   push from the app process when it runs)

All of this can be injected by an Expo config plugin — no manual android/
directory needed.

## The Expo path

- Community package **`react-native-android-widget`** is the standard route.
  It renders the widget from a React Native component tree and ships an
  Expo config plugin that wires the manifest/provider automatically.
  ⚠️ Must be verified against Expo SDK 57 + the new architecture before
  committing — it is a single-maintainer community package and RN/Expo
  breakages have happened before.
- Install would be `npx expo install react-native-android-widget`
  (per repo AGENTS.md: always use `expo install`, never bare npm).
- Widget UI must stick to the subset of RN components the package supports
  (View/Text/Image basics — no gradients, no SVGs, no custom native views).

## The hard part: keeping the widget fresh

This is where prayer widgets get painful, not the rendering:

- `RemoteViews` cannot run JS. Every update must be **computed then pushed**
  (prayer times → format → push). The app process (or a headless JS task)
  must wake up to do it.
- Android 12+ restricts exact alarms (`SCHEDULE_EXACT_ALARM` permission,
  user-grantable). WorkManager periodic work has a 15-minute minimum and is
  inexact. Chinese OEMs (Oppo — our test device family!) aggressively kill
  background work via battery optimization.
- Realistic update strategy: refresh on every app open + daily WorkManager
  tick + `ACTION_BOOT_COMPLETED` receiver. The widget will occasionally be
  stale on aggressive OEMs — this is true of every third-party prayer widget.
- Widget tap → deep link into the app (expo-router linking) to open the
  prayer screen. Straightforward.

## Suggested architecture

```
Widget UI (RN component, RemoteViews subset)
   ↑ push RemoteViews
Update module (JS): calculatePrayerTimes() → next prayer → format
   ↑ triggered by: app-open refresh, WorkManager daily tick, boot receiver
```

Prayer math already exists in `src/lib/prayerTimes.ts` — reuse as-is.

## Effort breakdown

| Piece | Estimate |
|---|---|
| Package install + config plugin + EAS prebuild verification | 0.5 day |
| Widget layout (next prayer, countdown, date) in supported subset | 1 day |
| Update pipeline (app-open refresh, daily worker, boot receiver) | 1–2 days |
| Exact-alarm permission flow + OEM battery-opt guidance UI | 1 day |
| Tap-to-open deep link wiring | 0.5 day |
| Testing across devices (esp. Oppo/Xiaomi battery killers) | 1 day |

## Risks

1. **Package maintenance** — verify `react-native-android-widget` supports
   SDK 57 / new arch before starting. Fallback: hand-written native module
   via a local config plugin (more work, ~+3 days).
2. **Background reliability** — on Oppo/Xiaomi the widget can go stale;
   mitigate with a "tap widget to refresh" affordance and a settings nudge
   to disable battery optimization.
3. **Battery** — each update wakes the app process; keep the worker lean
   (compute-only, no network).

## Cheaper alternative (recommended first)

The app already has ~80% of a **sticky countdown notification**
(`presentCountdownNotification` in `src/lib/notifications.ts`). A persistent
notification showing "Asr in 1h 23m" is always visible, needs zero native
code, no config plugin, and sidesteps every OEM widget-staleness problem.
Ship that first; do the real widget as Phase 2.

## iOS note

iOS widgets (WidgetKit) are a separate, larger effort (SwiftUI, App Groups,
separate extension target) — not covered here. Android-first is the right
call for this user base.
