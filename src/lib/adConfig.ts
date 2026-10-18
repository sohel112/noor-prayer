/**
 * Ad configuration — single place to manage all ad settings.
 *
 * AD PROVIDERS:
 * - AdMob (primary, added 2026-10-18 per user instruction overriding the
 *   2026-10-16 InMobi-only rule): react-native-google-mobile-ads
 *   Dashboard: https://admob.google.com (thesohailofficial1@gmail.com)
 * - InMobi (fallback, kept intact): modules/expo-inmobi
 *   Dashboard: https://publisher.inmobi.com (IlmWorks account)
 *   Haram blocking: "Deen Prayer - Haram Content Block" template applied
 *   (Gambling, Alcohol, Dating blocked; Editorial = Strict)
 *
 * HOW TO GO LIVE:
 * 1. Set ADS_ENABLED = true below
 * 2. Build a new APK/AAB (native module needs a fresh native build)
 */

// Master switch — keep false until ready for production ads.
export const ADS_ENABLED = true;

// Active provider: 'admob' or 'inmobi'. Switch back to 'inmobi' anytime
// without a code change beyond this line (InMobi code kept intact).
export const AD_PROVIDER: 'admob' | 'inmobi' = 'admob';

// AdMob — "Deen Apk" (thesohailofficial1@gmail.com account)
export const ADMOB = {
  // Android App ID — also set in app.json (react-native-google-mobile-ads plugin)
  androidAppId: 'ca-app-pub-6215554830981244~9804683225',
  // Banner ad unit
  bannerAdUnitId: 'ca-app-pub-6215554830981244/7652987592',
  // Interstitial ad unit
  interstitialAdUnitId: 'ca-app-pub-6215554830981244/5026824251',
  // Rewarded interstitial ad unit
  rewardedAdUnitId: 'ca-app-pub-6215554830981244/5407018075',
  // Rewarded ad unit (user-initiated, e.g. quiz hints)
  rewardedSimpleAdUnitId: 'ca-app-pub-6215554830981244/3060890484',
  // App open ad unit
  appOpenAdUnitId: 'ca-app-pub-6215554830981244/1536055821',
};

// Direct InMobi — banner placement for Deen Prayer (IlmWorks account)
export const INMOBI = {
  // InMobi Account ID (for SDK init) — from publisher.inmobi.com → My Account
  accountId: '205ab4eeffa3491da7658870fac7967f',
  // InMobi App Key for "Deen Prayer" (Android)
  appKey: '10000243107',
  // InMobi Banner Placement ID
  bannerPlacementId: 10000840954,
};

// Screens where banners are allowed (high traffic).
// Per user decision 2026-10-18: tasbih + duas list now included (banner at
// bottom, doesn't interfere with counting/reading).
// NEVER add: quran reader, surah screen.
export const AD_SCREENS = [
  'home',        // (tabs)/index.tsx — bottom
  'quiz',        // quiz.tsx — bottom
  'makkah',      // makkah.tsx — below video
  'names',       // 99 names — bottom
  'prayer-tracker',
  'profile',     // (tabs)/profile.tsx — bottom
  'tasbih',      // tasbih.tsx — bottom (user approved 2026-10-18)
  'duas',        // (tabs)/duas.tsx — bottom of list (user approved 2026-10-18)
] as const;
