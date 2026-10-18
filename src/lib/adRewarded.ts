import {
  RewardedInterstitialAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADS_ENABLED, AD_PROVIDER, ADMOB } from './adConfig';

let rewardedAd: RewardedInterstitialAd | null = null;
let loaded = false;
let lastShownAt = 0;

// Minimum gap between rewarded ads (ms).
const MIN_GAP_MS = 120_000;

export type RewardHandler = (reward: { type: string; amount: number }) => void;

/**
 * Preload the rewarded interstitial. Call early.
 */
export function preloadRewardedAd(): void {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return;
  try {
    const unitId = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : ADMOB.rewardedAdUnitId;
    rewardedAd = RewardedInterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    loaded = false;
    const unsubLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        loaded = true;
      },
    );
    const unsubClosed = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        loaded = false;
        unsubLoaded();
        unsubClosed();
        preloadRewardedAd();
      },
    );
  } catch (e) {
    console.warn('[ads] rewarded preload failed:', e);
  }
}

/**
 * Show the rewarded interstitial. Calls onReward when the user earns
 * the reward (after watching). Returns true if an ad was shown.
 *
 * NEVER call this on ibadah screens.
 */
export function showRewardedAd(onReward: RewardHandler): boolean {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return false;
  const now = Date.now();
  if (!rewardedAd || !loaded) {
    preloadRewardedAd();
    return false;
  }
  if (now - lastShownAt < MIN_GAP_MS) return false;
  try {
    const unsubReward = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        unsubReward();
        onReward({ type: reward.type, amount: reward.amount });
      },
    );
    rewardedAd.show();
    lastShownAt = now;
    return true;
  } catch (e) {
    console.warn('[ads] rewarded show failed:', e);
    return false;
  }
}
