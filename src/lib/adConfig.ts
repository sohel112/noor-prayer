/**
 * Ad configuration — single place to manage all ad settings.
 *
 * DIRECT INMOBI INTEGRATION (no AdMob):
 * - Native module: modules/expo-inmobi (wraps InMobi Android SDK 11.1.1)
 * - Dashboard: https://publisher.inmobi.com (IlmWorks account)
 * - Haram blocking: "Deen Prayer - Haram Content Block" template applied
 *   (Gambling, Alcohol, Dating blocked; Editorial = Strict)
 *
 * HOW TO GO LIVE:
 * 1. Set ADS_ENABLED = true below
 * 2. Build a new APK/AAB (native module needs a fresh native build)
 */

// Master switch — keep false until ready for production ads.
export const ADS_ENABLED = true;

// Direct InMobi — banner placement for Deen Prayer (IlmWorks account)
export const INMOBI = {
  // InMobi Account ID (for SDK init) — from publisher.inmobi.com → My Account
  accountId: '205ab4eeffa3491da7658870fac7967f',
  // InMobi App Key for "Deen Prayer" (Android)
  appKey: '10000243107',
  // InMobi Banner Placement ID
  bannerPlacementId: 10000840954,
};

// Screens where banners are allowed (high traffic, NOT ibadah-sensitive).
// NEVER add: quran reader, surah screen, adhkar/duas reading, tasbih active counting.
export const AD_SCREENS = [
  'home',        // (tabs)/index.tsx — bottom
  'quiz',        // quiz.tsx — bottom
  'makkah',      // makkah.tsx — below video
  'names',       // 99 names — bottom
  'prayer-tracker',
  'profile',     // (tabs)/profile.tsx — bottom
] as const;
