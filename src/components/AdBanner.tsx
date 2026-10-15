import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { InMobiBannerView, initializeInMobi } from 'expo-inmobi';
import { ADS_ENABLED, INMOBI } from '../lib/adConfig';

let didInit = false;

/**
 * Reusable banner ad component — direct InMobi SDK, no AdMob.
 * - Only renders when ADS_ENABLED is true.
 * - Initializes the InMobi SDK once (idempotent).
 * - 320x50 banner, centered.
 * - Place at the bottom of high-traffic, non-ibadah screens.
 */
export function AdBanner() {
  useEffect(() => {
    if (!didInit && INMOBI.accountId && !INMOBI.accountId.startsWith('REPLACE')) {
      try {
        initializeInMobi(INMOBI.accountId);
        didInit = true;
      } catch (e) {
        // Native module not linked (e.g. Expo Go) — banners stay hidden.
        console.warn('[ads] InMobi init failed:', e);
      }
    }
  }, []);

  if (!ADS_ENABLED) return null;

  return (
    <View style={styles.container}>
      <InMobiBannerView placementId={INMOBI.bannerPlacementId} style={styles.banner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  banner: {
    width: 320,
    height: 50,
  },
});
