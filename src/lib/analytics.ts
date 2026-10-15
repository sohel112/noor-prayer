/**
 * Privacy-first analytics for Deen — Supabase-backed, no third-party trackers.
 *
 * Tracks:
 * - app_open (DAU)
 * - screen_view (which features are popular)
 * - prayer_completed
 * - ad_impression (for revenue tracking)
 *
 * All events are anonymous-ish: we use a random install ID, not personal data.
 * User can opt out in Settings (analyticsEnabled).
 */
import { getSupabase } from './supabase';
import { getJSON, setJSON } from './storage';

const INSTALL_ID_KEY = 'analytics_install_id';
const OPT_OUT_KEY = 'analytics_opt_out';

let installId: string | null = null;
let optOut: boolean | null = null;

/** Get or create a random install ID (not tied to identity). */
async function getInstallId(): Promise<string> {
  if (installId) return installId;
  let id = await getJSON<string>(INSTALL_ID_KEY, '');
  if (!id) {
    id = 'inst_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await setJSON(INSTALL_ID_KEY, id);
  }
  installId = id;
  return id;
}

/** Check if user opted out of analytics. */
export async function isAnalyticsOptedOut(): Promise<boolean> {
  if (optOut !== null) return optOut;
  optOut = await getJSON<boolean>(OPT_OUT_KEY, false);
  return optOut;
}

/** Opt out (or back in) of analytics. */
export async function setAnalyticsOptOut(value: boolean): Promise<void> {
  optOut = value;
  await setJSON(OPT_OUT_KEY, value);
}

/**
 * Track an event. Fire-and-forget — never blocks the UI, never crashes.
 * Silently skips if: opted out, Supabase not configured, or offline.
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, any> = {},
): Promise<void> {
  try {
    if (await isAnalyticsOptedOut()) return;
    const client = getSupabase();
    if (!client) return;

    const id = await getInstallId();
    await client.from('analytics_events').insert({
      install_id: id,
      event_name: eventName,
      properties,
    });
    // Intentionally no await on response — fire and forget.
  } catch {
    // Analytics must never break the app.
  }
}

/** Track app open (for DAU). Call once per app launch. */
export function trackAppOpen(): void {
  trackEvent('app_open', {
    platform: 'android',
    ts: new Date().toISOString(),
  });
}

/** Track screen view. */
export function trackScreen(screenName: string): void {
  trackEvent('screen_view', { screen: screenName });
}

/** Track prayer completion. */
export function trackPrayer(prayer: string): void {
  trackEvent('prayer_completed', { prayer });
}

/** Track ad impression (for revenue analytics). */
export function trackAdImpression(placement: string): void {
  trackEvent('ad_impression', { placement });
}
