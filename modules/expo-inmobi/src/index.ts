// STUB - InMobi native module removed for crash investigation.
// All functions are no-ops. Native code is NOT bundled.
import * as React from 'react';

export function initializeInMobi(_accountId: string): void {
  // no-op (stub)
}

export const isInMobiNativeAvailable = false;

export async function showInMobiInterstitial(_placementId: number): Promise<boolean> {
  return false;
}

export type InMobiBannerViewProps = {
  placementId: number;
  style?: any;
};

export const InMobiBannerView: React.ComponentType<InMobiBannerViewProps> = () => null;
