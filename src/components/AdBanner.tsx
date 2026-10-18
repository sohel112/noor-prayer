import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { InMobiBannerView, initializeInMobi } from 'expo-inmobi';
import { ADS_ENABLED, AD_PROVIDER, ADMOB, INMOBI } from '../lib/adConfig';

let didInitInMobi = false;

/**
 * Reusable banner ad component — AdMob primary, InMobi fallback.
 * - Only renders when ADS_ENABLED is true.
 * - 320x50 banner, centered.
 * - Place at the bottom of high-traffic, non-ibadah screens.
 * - Switch provider via AD_PROVIDER in lib/adConfig.ts (no rebuild of this file needed).
 */
export function AdBanner() {
  useEffect(() => {
    if (AD_PROVIDER !== 'inmobi') return;
    if (!didInitInMobi && INMOBI.accountId && !INMOBI.accountId.startsWith('REPLACE')) {
      try {
        initializeInMobi(INMOBI.accountId);
        didInitInMobi = true;
      } catch (e) {
        // Native module not linked (e.g. Expo Go) — banners stay hidden.
        console.warn('[ads] InMobi init failed:', e);
      }
    }
  }, []);

  if (!ADS_ENABLED) return null;

  // ---- AdMob (primary) ----
  if (AD_PROVIDER === 'admob') {
    const unitId = __DEV__ ? TestIds.BANNER : ADMOB.bannerAdUnitId;
    return (
      <View style={styles.container}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    );
  }

  // ---- InMobi (fallback, kept intact) ----
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
