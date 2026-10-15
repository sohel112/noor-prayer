// Optional sign-in — cloud backup for users who want it. Never forced.
// Emerald Royal design: deep emerald + gold.

import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Sub, useTheme, GoldButton } from '../components/ui';
import { useSettings } from '../lib/settings';
import { useAuth } from '../lib/auth';
import { t } from '../lib/i18n';
import { syncAll } from '../lib/sync';

export default function Login() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { configured, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const afterAuth = async () => {
    // Pull cloud data first, then push local — nothing is lost.
    await syncAll();
    router.replace('/(tabs)');
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('email', lang) + ' / ' + t('password', lang));
      return;
    }
    setBusy(true);
    setError(null);
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else if (res.needsConfirm) {
      Alert.alert(t('signUp', lang), t('checkEmail', lang), [{ text: 'OK' }]);
      setMode('in');
    } else {
      afterAuth();
    }
  };

  const google = async () => {
    setBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.error) setError(res.error);
    else afterAuth();
  };

  const skip = () => router.replace('/(tabs)');

  return (
    <Screen>
      <Scroller>
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
          <Text style={{ fontSize: 56 }}>🌙</Text>
          <Text style={[styles.brand, { color: th.gold }]}>Deen</Text>
          <Text style={[styles.title, { color: th.text }]}>{t('loginTitle', lang)}</Text>
          <Sub style={{ textAlign: 'center', marginTop: 6 }}>{t('loginSub', lang)}</Sub>
        </View>

        {!configured ? (
          <Card style={{ borderColor: th.gold, borderWidth: 1 }}>
            <Sub style={{ textAlign: 'center' }}>🔒 {t('cloudNotSetup', lang)}</Sub>
          </Card>
        ) : (
          <Card>
            <Sub style={styles.label}>{t('email', lang)}</Sub>
            <TextInput
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="you@example.com" placeholderTextColor={th.sub}
              style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
            />
            <Sub style={[styles.label, { marginTop: 12 }]}>{t('password', lang)}</Sub>
            <TextInput
              value={password} onChangeText={setPassword}
              secureTextEntry autoCapitalize="none"
              placeholder="••••••••" placeholderTextColor={th.sub}
              style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
            />
            {error ? <Text style={[styles.error, { color: '#E74C3C' }]}>{error}</Text> : null}

            {busy ? (
              <ActivityIndicator color={th.gold} size="large" style={{ marginTop: 16 }} />
            ) : (
              <GoldButton
                label={mode === 'in' ? t('signIn', lang) : t('signUp', lang)}
                onPress={submit}
                style={{ marginTop: 16 }}
              />
            )}

            <TouchableOpacity onPress={google} disabled={busy}
              style={[styles.googleBtn, { borderColor: th.border, backgroundColor: th.card }]}>
              <Text style={{ fontSize: 18 }}>🔵</Text>
              <Text style={{ color: th.text, fontWeight: '700', fontSize: 15 }}>{t('googleSignIn', lang)}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }}
              style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: th.gold, fontSize: 14 }}>
                {mode === 'in' ? t('noAccount', lang) : t('haveAccount', lang)}{' '}
                <Text style={{ fontWeight: '800' }}>{mode === 'in' ? t('signUp', lang) : t('signIn', lang)}</Text>
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        <TouchableOpacity onPress={skip} style={{ marginTop: 8, alignItems: 'center', padding: 12 }}>
          <Text style={{ color: th.sub, fontSize: 15, textDecorationLine: 'underline' }}>
            {t('continueAsGuest', lang)} →
          </Text>
        </TouchableOpacity>

        <Sub style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
          🔒 {t('privacyNote', lang)}
        </Sub>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 40, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  title: { fontSize: 20, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  label: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  error: { marginTop: 10, fontSize: 14, textAlign: 'center' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginTop: 12,
  },
});
