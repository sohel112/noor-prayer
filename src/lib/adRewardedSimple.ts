import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADS_ENABLED, AD_PROVIDER, ADMOB } from './adConfig';

let rewarded: RewardedAd | null = null;
let loaded = false;

export type SimpleRewardHandler = (reward: { type: string; amount: number }) => void;

/**
 * Preload the user-initiated rewarded ad (e.g. for quiz hints).
 * Call when entering a screen that offers rewarded actions.
 */
export function preloadSimpleRewardedAd(): void {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return;
  try {
    const unitId = __DEV__ ? TestIds.REWARDED : ADMOB.rewardedSimpleAdUnitId;
    rewarded = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    loaded = false;
    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        loaded = true;
      },
    );
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      unsubLoaded();
      unsubClosed();
      preloadSimpleRewardedAd();
    });
    rewarded.load();
  } catch (e) {
    console.warn('[ads] simple rewarded preload failed:', e);
  }
}

/**
 * Show the rewarded ad. User must tap a button to trigger this —
 * never auto-show. Calls onReward when the user completes watching.
 */
export function showSimpleRewardedAd(onReward: SimpleRewardHandler): boolean {
  if (!ADS_ENABLED || AD_PROVIDER !== 'admob') return false;
  if (!rewarded || !loaded) {
    preloadSimpleRewardedAd();
    return false;
  }
  try {
    const unsubReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        unsubReward();
        onReward({ type: reward.type, amount: reward.amount });
      },
    );
    rewarded.show();
    return true;
  } catch (e) {
    console.warn('[ads] simple rewarded show failed:', e);
    return false;
  }
}

/** Is a rewarded ad ready to show right now? (for enabling/disabling the button) */
export function isSimpleRewardedAdReady(): boolean {
  return ADS_ENABLED && AD_PROVIDER === 'admob' && !!rewarded && loaded;
}
