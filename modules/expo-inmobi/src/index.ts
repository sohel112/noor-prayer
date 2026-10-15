import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

/**
 * Direct InMobi SDK bindings — no AdMob / Google Mobile Ads.
 *
 * Usage:
 *   import { initializeInMobi, InMobiBannerView } from 'expo-inmobi';
 *   initializeInMobi('YOUR_ACCOUNT_ID'); // once at app start
 *   <InMobiBannerView placementId={10000840954} />
 */

type ExpoInmobiModuleType = {
  initialize(accountId: string): void;
};

// Native module may be absent (e.g. Expo Go) — fail soft, not crash.
let ExpoInmobiModule: ExpoInmobiModuleType | null = null;
try {
  ExpoInmobiModule = requireNativeModule<ExpoInmobiModuleType>('ExpoInmobi');
} catch {
  ExpoInmobiModule = null;
}

/** Initialize the InMobi SDK. Call once at app startup. No-op if native module is absent. */
export function initializeInMobi(accountId: string): void {
  try {
    ExpoInmobiModule?.initialize(accountId);
  } catch {
    // Native module not linked — ignore.
  }
}

export type InMobiBannerViewProps = ViewProps & {
  /** InMobi banner Placement ID (e.g. 10000840954) */
  placementId: number;
};

/** True only when the native InMobi module is actually linked into the app. */
export const isInMobiNativeAvailable = ExpoInmobiModule !== null;

const NativeBannerView: React.ComponentType<InMobiBannerViewProps> | null =
  isInMobiNativeAvailable
    ? requireNativeViewManager('ExpoInmobi_ExpoInmobiBannerView')
    : null;

/** 320x50 banner backed directly by InMobi's native SDK. Renders nothing if native module is absent. */
export function InMobiBannerView(props: InMobiBannerViewProps) {
  if (!isInMobiNativeAvailable || !NativeBannerView) return null;
  return React.createElement(NativeBannerView, props);
}
