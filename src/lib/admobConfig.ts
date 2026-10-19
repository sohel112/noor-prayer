/**
 * AdMob configuration — Google Mobile Ads for the NEET MCQ app.
 *
 * STATUS: account skinfratechsolution@gmail.com is PENDING Google verification.
 * Until approved + real IDs are filled below, ADMOB_ENABLED stays false and
 * every AdMob surface renders nothing (zero layout impact, never crashes).
 *
 * GO-LIVE (after Google approves the account):
 * 1. AdMob console → add app "NEET MCQ Prep" (Android, package
 *    com.ilmworks.neetmcq) → note the App ID (ca-app-pub-…~…)
 * 2. Create 4 ad units under that app: Banner, Interstitial, Rewarded,
 *    Rewarded Interstitial → note each Ad Unit ID (ca-app-pub-…/…)
 * 3. Fill the placeholders below, set ADMOB_ENABLED = true
 * 4. Put the App ID in app.json → plugins → react-native-google-mobile-ads
 *    → androidAppId (replacing the placeholder there too)
 * 5. Rebuild APK/AAB (native plugin needs a fresh native build)
 *
 * NOTE: the "Yojna Guide" ad units in this AdMob account are for a different
 * app — NEVER reuse them here; create fresh units under "NEET MCQ Prep".
 */

const PLACEHOLDER_APP = 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY';
const PLACEHOLDER_UNIT = 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';

// Google's OFFICIAL test IDs — safe to use, never causes invalid traffic.
// https://developers.google.com/admob/android/test-ads
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';

// REAL IDs from AdMob dashboard (user provided 2026-10-19)
const REAL_APP_ID = 'ca-app-pub-6215554830981244~4978189962';
const REAL_BANNER = 'ca-app-pub-6215554830981244/7969069405';
const REAL_INTERSTITIAL = 'ca-app-pub-6215554830981244/2081573043';
const REAL_REWARDED = 'ca-app-pub-6215554830981244/4384127743';
const REAL_REWARDED_INTERSTITIAL = 'ca-app-pub-6215554830981244/4791321856';

/** Master switch — TRUE with all REAL AdMob IDs. */
export const ADMOB_ENABLED = true;

export const ADMOB = {
  /** AdMob App ID — REAL (NEET MCQ Prep). */
  androidAppId: REAL_APP_ID,
  /** Banner ad unit — REAL. */
  bannerAdUnitId: REAL_BANNER,
  /** Interstitial ad unit — REAL. */
  interstitialAdUnitId: REAL_INTERSTITIAL,
  /** Rewarded ad unit — REAL. */
  rewardedAdUnitId: REAL_REWARDED,
  /** Rewarded interstitial ad unit — REAL. */
  rewardedInterstitialAdUnitId: REAL_REWARDED_INTERSTITIAL,
};

function isRealId(id: string): boolean {
  return !!id && !id.includes('XXXX') && !id.includes('YYYY') && !id.includes('ZZZZ');
}

/** True when a real AdMob ad could actually show (switch on + real IDs). */
export function canShowAdMob(): boolean {
  return (
    ADMOB_ENABLED &&
    isRealId(ADMOB.androidAppId) &&
    isRealId(ADMOB.bannerAdUnitId)
  );
}

/** True when AdMob interstitials could show. */
export function canShowAdMobInterstitial(): boolean {
  return ADMOB_ENABLED && isRealId(ADMOB.androidAppId) && isRealId(ADMOB.interstitialAdUnitId);
}

/** True when AdMob rewarded ads could show. */
export function canShowAdMobRewarded(): boolean {
  return ADMOB_ENABLED && isRealId(ADMOB.androidAppId) && isRealId(ADMOB.rewardedAdUnitId);
}

/** True when AdMob rewarded interstitials could show. */
export function canShowAdMobRewardedInterstitial(): boolean {
  return ADMOB_ENABLED && isRealId(ADMOB.androidAppId) && isRealId(ADMOB.rewardedInterstitialAdUnitId);
}
