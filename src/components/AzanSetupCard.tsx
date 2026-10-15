// In-app azan notification setup — 1 tap, no deep settings guides.
// Used in Onboarding (step 4) and as a dismissible card on Home.

import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Card, Title, Sub, useTheme } from './ui';
import {
  ensureNotificationPermissions,
  getNotificationPermissionStatus,
  requestBatteryExemption,
} from '../lib/notifications';
import { setJSON, getJSON } from '../lib/storage';

const DISMISS_KEY = 'azanSetupDismissed';

export async function isAzanSetupDismissed(): Promise<boolean> {
  return !!(await getJSON(DISMISS_KEY, false));
}

export default function AzanSetupCard({ onDone }: { onDone?: () => void }) {
  const th = useTheme();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'ask' | 'battery' | 'done'>('ask');
  const [status, setStatus] = useState('');

  const enable = async () => {
    setBusy(true);
    setStatus('');
    const granted = await ensureNotificationPermissions();
    setBusy(false);
    if (!granted) {
      const s = await getNotificationPermissionStatus();
      setStatus(
        s === 'denied'
          ? 'Notifications are blocked. Please allow them in your phone Settings → Apps → Deen → Notifications.'
          : 'Permission was not granted. Try again.',
      );
      return;
    }
    // Permission granted → offer the 1-tap battery exemption (Android).
    if (Platform.OS === 'android') {
      setStep('battery');
    } else {
      setStep('done');
      onDone?.();
    }
  };

  const openBattery = async () => {
    setBusy(true);
    const ok = await requestBatteryExemption();
    setBusy(false);
    if (!ok) {
      setStatus('Could not open settings automatically. Please allow "Unrestricted" battery usage for Deen in Settings → Apps → Deen → Battery.');
      return;
    }
    setStep('done');
    onDone?.();
  };

  const dismiss = async () => {
    await setJSON(DISMISS_KEY, true);
    onDone?.();
  };

  return (
    <Card style={[styles.card, { borderColor: th.accent, borderWidth: 1.5 }]}>
      {step === 'ask' && (
        <View>
          <Title>🔔 Never miss an azan</Title>
          <Sub>Get a loud alert at every prayer time — set up in one tap.</Sub>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: th.accent }]}
            onPress={enable}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={th.onAccent} />
            ) : (
              <Text style={[styles.btnText, { color: th.onAccent }]}>Enable azan notifications</Text>
            )}
          </TouchableOpacity>
          {!!status && <Sub style={{ marginTop: 10, color: '#E08080' }}>{status}</Sub>}
          <TouchableOpacity style={{ marginTop: 12 }} onPress={dismiss}>
            <Text style={{ color: th.sub, textAlign: 'center' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'battery' && (
        <View>
          <Title>🔋 One last tap</Title>
          <Sub>
            Phone makers kill background apps to save battery — that's why azans
            silently stop. Tap below and choose "Allow" so Deen always rings on time.
          </Sub>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: th.accent }]}
            onPress={openBattery}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={th.onAccent} />
            ) : (
              <Text style={[styles.btnText, { color: th.onAccent }]}>Allow background azan →</Text>
            )}
          </TouchableOpacity>
          {!!status && <Sub style={{ marginTop: 10, color: '#E08080' }}>{status}</Sub>}
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => { setStep('done'); onDone?.(); }}>
            <Text style={{ color: th.sub, textAlign: 'center' }}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'done' && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Title>You're all set!</Title>
          <Sub style={{ textAlign: 'center' }}>
            Deen will alert you at every prayer time, in shaa Allah.
          </Sub>
          <TouchableOpacity style={[styles.btn, { backgroundColor: th.accent }]} onPress={dismiss}>
            <Text style={[styles.btnText, { color: th.onAccent }]}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20 },
  btn: { borderRadius: 12, padding: 14, marginTop: 16, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 16 },
});
