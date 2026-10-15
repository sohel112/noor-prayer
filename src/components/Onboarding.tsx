import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings, Lang } from '../lib/settings';
import { LANGS } from '../lib/i18n';
import { PRAYER_METHODS, detectMethodForLocation, methodForDetection, DetectedMethod } from '../lib/prayerTimes';
import { useLocation } from '../lib/location';
import { setJSON } from '../lib/storage';
import { router } from 'expo-router';
import AzanSetupCard from './AzanSetupCard';

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { settings, update } = useSettings();
  const th = useTheme();
  const [step, setStep] = useState(0);
  const { useGps } = useLocation();
  const [detected, setDetected] = useState<DetectedMethod | null>(null);
  const [showManual, setShowManual] = useState(false);

  const finish = async () => {
    await setJSON('onboarded', true);
    onDone();
  };

  const nextBtn = (label = 'Continue →') => (
    <TouchableOpacity style={[styles.btn, { backgroundColor: th.accent }]} onPress={() => setStep(s => s + 1)}>
      <Text style={[styles.btnText, { color: th.onAccent }]}>{label}</Text>
    </TouchableOpacity>
  );

  const onUseGps = async () => {
    const saved = await useGps();
    if (saved) {
      // Auto-detect the right calculation method from GPS coordinates (offline).
      const d = detectMethodForLocation(saved.lat, saved.lng);
      setDetected(d);
      update({ methodId: d.methodId });
    } else {
      setDetected(null); // permission denied → manual method pick
    }
    setStep(s => s + 1);
  };

  const methodList = (selectedId: string) => (
    <View>
      {PRAYER_METHODS.map(m => (
        <TouchableOpacity key={m.id} onPress={() => update({ methodId: m.id })}
          style={[styles.opt, { borderColor: th.border, backgroundColor: selectedId === m.id ? th.accentSoft : 'transparent' }]}>
          <Text style={{ color: th.text, fontSize: 15 }}>{m.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Screen>
      <View style={styles.wrap}>
        {step === 0 && (
          <Card style={styles.card}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>🕌</Text>
            <View style={{ alignItems: 'center' }}><Title>Deen</Title></View>
            <Sub style={{ textAlign: 'center' }}>
              Prayer times, Quran, Qibla and more — 100% on your phone. No account needed, no data sold, no forced ads.
            </Sub>
            {nextBtn('Get started →')}
          </Card>
        )}
        {step === 1 && (
          <Card style={styles.card}>
            <Title>Language / زبان / भाषा</Title>
            <ScrollView style={{ maxHeight: 320, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {LANGS.map(l => (
                <TouchableOpacity key={l.code} onPress={() => update({ lang: l.code })}
                  style={[styles.opt, { borderColor: th.border, backgroundColor: settings.lang === l.code ? th.accentSoft : 'transparent' }]}>
                  <Text style={{ color: th.text, fontSize: 16 }}>
                    {l.flag} {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {nextBtn()}
          </Card>
        )}
        {step === 2 && (
          <Card style={styles.card}>
            <Title>📍 Location</Title>
            <Sub>Used only on this phone for prayer times & Qibla. Never uploaded.</Sub>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: th.accent, marginTop: 12 }]}
              onPress={onUseGps}
            >
              <Text style={[styles.btnText, { color: th.onAccent }]}>Use my location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={() => { setDetected(null); setStep(s => s + 1); }}>
              <Text style={{ color: th.sub, textAlign: 'center' }}>Skip — I'll set it later</Text>
            </TouchableOpacity>
          </Card>
        )}
        {step === 3 && (
          <Card style={styles.card}>
            <Title>🕌 Prayer time method</Title>
            {detected ? (
              <View>
                <Sub>
                  Based on your location{detected.country ? ` (${detected.country})` : ''}, we picked the standard method:
                </Sub>
                <View style={[styles.detectedBox, { borderColor: th.accent, backgroundColor: th.accentSoft }]}>
                  <Text style={{ fontSize: 28, textAlign: 'center' }}>✓</Text>
                  <Text style={[styles.detectedName, { color: th.text }]}>
                    {methodForDetection(detected).name}
                  </Text>
                  <Sub style={{ textAlign: 'center' }}>Most accurate for your region.</Sub>
                </View>
                <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setShowManual(v => !v)}>
                  <Text style={{ color: th.accent, textAlign: 'center', fontWeight: '600' }}>
                    {showManual ? 'Hide options ↑' : 'Change method'}
                  </Text>
                </TouchableOpacity>
                {showManual ? methodList(settings.methodId) : null}
              </View>
            ) : (
              <View>
                <Sub>Pick the calculation used in your country. You can change this later in Settings.</Sub>
                {methodList(settings.methodId)}
              </View>
            )}
            {nextBtn()}
          </Card>
        )}
        {step === 4 && (
          <View style={styles.wrap}>
            <AzanSetupCard onDone={finish} />
            <TouchableOpacity style={{ marginTop: 4 }} onPress={() => router.push('/battery')}>
              <Text style={{ color: th.sub, textAlign: 'center' }}>
                Having trouble? Open the detailed battery guide
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24 },
  btn: { borderRadius: 12, padding: 14, marginTop: 20, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 16 },
  opt: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  detectedBox: { borderWidth: 2, borderRadius: 14, padding: 18, marginTop: 14 },
  detectedName: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
