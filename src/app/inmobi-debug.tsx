// InMobi Debug Screen — development builds only.
// Shows native module status, ad load state, and errors.
import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { Screen, Card, Sub, useTheme } from '../components/ui';
import { INMOBI, ADS_ENABLED } from '../lib/adConfig';

export default function InmobiDebug() {
  const th = useTheme();
  const [lines, setLines] = useState<string[]>(['Checking...']);

  const check = () => {
    const out: string[] = [];
    out.push(`ADS_ENABLED: ${ADS_ENABLED}`);
    out.push(`App Key: ${INMOBI.appKey}`);
    out.push(`Banner Placement: ${INMOBI.bannerPlacementId}`);
    try {
      const mod = requireNativeModule('ExpoInmobi');
      out.push('✅ Native module LOADED');
      out.push(`Methods: ${Object.keys(mod).join(', ') || '(none listed)'}`);
    } catch (e: any) {
      out.push(`❌ Native module NOT loaded: ${e.message}`);
    }
    // Check if the view manager exists
    try {
      const { NativeModules } = require('react-native');
      const keys = Object.keys(NativeModules).filter(k => k.toLowerCase().includes('inmobi'));
      out.push(`NativeModules with 'inmobi': ${keys.join(', ') || '(none)'}`);
    } catch (e: any) {
      out.push(`NativeModules check failed: ${e.message}`);
    }
    setLines(out);
  };

  useEffect(() => { check(); }, []);

  return (
    <Screen>
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: th.text, marginBottom: 12 }}>
          🔍 InMobi Debug
        </Text>
        <Card>
          {lines.map((l, i) => (
            <Text key={i} style={{ color: th.text, fontSize: 13, marginBottom: 6, fontFamily: 'monospace' }}>
              {l}
            </Text>
          ))}
        </Card>
        <TouchableOpacity
          onPress={check}
          style={{ backgroundColor: th.gold, borderRadius: 12, padding: 14, marginTop: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>🔄 Re-check</Text>
        </TouchableOpacity>
        <Sub style={{ marginTop: 12, textAlign: 'center' }}>
          Dev builds only. Remove before production.
        </Sub>
      </ScrollView>
    </Screen>
  );
}
