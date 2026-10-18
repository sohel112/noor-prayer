import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { ADS_ENABLED, AD_PROVIDER, ADMOB } from './adConfig';

let appOpenAd: AppOpenAd | null = null;
let loaded = false;
let shownThisSession = false;

/**
 * Preload the App Open ad. Call on app start.
 */
export function preloadAppOpenAd(): void {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return;
  try {
    const unitId = __DEV__ ? TestIds.APP_OPEN : ADMOB.appOpenAdUnitId;
    appOpenAd = AppOpenAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    loaded = false;
    const unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      loaded = true;
    });
    const unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      unsubLoaded();
      unsubClosed();
    });
    appOpenAd.load();
  } catch (e) {
    console.warn('[ads] app-open preload failed:', e);
  }
}

/**
 * Show the App Open ad once per app session (on cold start).
 * Call after preload; safe to call repeatedly — shows at most once.
 */
export function showAppOpenAdOnce(): void {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return;
  if (shownThisSession || !appOpenAd || !loaded) return;
  try {
    shownThisSession = true;
    appOpenAd.show();
  } catch (e) {
    console.warn('[ads] app-open show failed:', e);
  }
}
