import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, AD_PROVIDER, ADMOB } from './adConfig';

let interstitial: InterstitialAd | null = null;
let loaded = false;
let lastShownAt = 0;

// Minimum gap between interstitials (ms) — prevents ad spam.
const MIN_GAP_MS = 90_000;

/**
 * Preload the AdMob interstitial. Call early (e.g. on app start or
 * when entering a screen that may show it).
 */
export function preloadInterstitial(): void {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return;
  try {
    const unitId = __DEV__ ? TestIds.INTERSTITIAL : ADMOB.interstitialAdUnitId;
    interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    loaded = false;
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loaded = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      unsubLoaded();
      unsubClosed();
      // Auto-reload for the next opportunity.
      preloadInterstitial();
    });
  } catch (e) {
    console.warn('[ads] interstitial preload failed:', e);
  }
}

/**
 * Show the interstitial if one is loaded and enough time passed since
 * the last show. Returns true if an ad was shown.
 *
 * NEVER call this on ibadah screens (Quran reader, duas, tasbih counting,
 * qibla) or during prayer time flows.
 */
export function showInterstitial(): boolean {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return false;
  const now = Date.now();
  if (!interstitial || !loaded) {
    preloadInterstitial();
    return false;
  }
  if (now - lastShownAt < MIN_GAP_MS) return false;
  try {
    interstitial.show();
    lastShownAt = now;
    return true;
  } catch (e) {
    console.warn('[ads] interstitial show failed:', e);
    return false;
  }
}
