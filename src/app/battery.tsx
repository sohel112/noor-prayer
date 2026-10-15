import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';

// Battery-optimization guide — the #1 technical complaint against prayer apps
// is missed azan alerts on Xiaomi/Samsung/Huawei due to aggressive battery savers.

const STEPS: { brand: string; steps: string[] }[] = [
  {
    brand: 'Xiaomi / Redmi / POCO (MIUI)',
    steps: [
      'Settings → Apps → Manage apps → Deen',
      'Battery saver → No restrictions',
      'Autostart → enable for Deen',
      'Lock Deen in Recent apps (swipe down on its card) so MIUI never kills it',
    ],
  },
  {
    brand: 'Samsung (One UI)',
    steps: [
      'Settings → Battery → Background usage limits',
      'Never sleeping apps → add Deen',
      'Settings → Apps → Deen → Battery → Unrestricted',
    ],
  },
  {
    brand: 'Huawei / Honor (EMUI)',
    steps: [
      'Settings → Battery → App launch → Deen',
      'Turn OFF "Manage automatically", turn ON all three manual switches',
    ],
  },
  {
    brand: 'Oppo / Vivo / Realme',
    steps: [
      'Settings → Battery → Deen → Allow background activity',
      'Lock Deen in Recent apps so it is not cleared',
    ],
  },
];

export default function BatteryGuide() {
  const { settings } = useSettings();
  const th = useTheme();
  return (
    <Screen>
      <Scroller>
        <Title>🔋 Never miss an azan</Title>
        <Card style={{ borderColor: th.accent, borderWidth: 2 }}>
          <Sub style={{ fontWeight: '700', color: th.accent }}>
            Why this matters
          </Sub>
          <Sub style={{ marginTop: 6 }}>
            Phone makers aggressively kill background apps to save battery — this is why
            prayer alerts silently stop working in other apps. Take 1 minute to whitelist
            Deen and your azan will always ring on time.
          </Sub>
        </Card>
        {STEPS.map(b => (
          <Card key={b.brand}>
            <Text style={{ color: th.text, fontSize: 16, fontWeight: '700' }}>{b.brand}</Text>
            {b.steps.map((s, i) => (
              <View key={i} style={styles.step}>
                <Text style={[styles.num, { backgroundColor: th.accentSoft, color: th.accent }]}>{i + 1}</Text>
                <Sub style={{ flex: 1 }}>{s}</Sub>
              </View>
            ))}
          </Card>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, textAlign: 'center', fontWeight: '700', lineHeight: 24 },
});
