import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SettingsProvider, useSettings } from '../lib/settings';
import { AuthProvider } from '../lib/auth';
import Onboarding from '../components/Onboarding';
import Splash from '../components/Splash';
import { RootErrorBoundary } from '../components/RootErrorBoundary';
import { getJSON } from '../lib/storage';
import { playAzan, stopAzan } from '../lib/azanPlayer';
import { checkAppIntegrity, shouldAllowCloudSync } from '../lib/security';

function Inner() {
  const { settings } = useSettings();
  const [checked, setChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [splashed, setSplashed] = useState(false);
  const notifListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    getJSON('onboarded', false).then(v => {
      setOnboarded(!!v);
      setChecked(true);
    });
    // Silent integrity sweep at startup — result is logged only.
    // High-confidence tampering (debug build, repackaged, hooking tools)
    // disables cloud sync; root alone does not block legit users.
    checkAppIntegrity().then(r => {
      if (r.tampered) console.warn('[security] risk=' + r.riskScore, r.reasons.join(','));
      (globalThis as any).__cloudSyncAllowed = shouldAllowCloudSync(r);
    }).catch(() => {});
  }, []);

  // Azan auto-play: when a prayer notification arrives while the app is open,
  // or the user taps it / taps "Play azan", play the azan sound.
  // Force-wake Fajr notifications open the full-screen alarm instead.
  useEffect(() => {
    const maybePlay = (data: any) => {
      if (data?.kind === 'prayer-azan' && data?.playAzan) {
        playAzan();
      }
    };
    const maybeAlarm = (data: any) => {
      if (data?.kind === 'prayer-azan' && data?.forceWake) {
        // Open the full-screen Fajr alarm screen.
        try { router.push('/fajr-alarm'); } catch { /* ignore */ }
        return true;
      }
      return false;
    };
    notifListener.current = Notifications.addNotificationReceivedListener(n =>
      maybePlay(n.request.content.data),
    );
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      const data = r.notification.request.content.data;
      const action = r.actionIdentifier;
      if (action === 'DISMISS') {
        // User tapped "Dismiss" — stop the azan, don't replay it.
        stopAzan();
        return;
      }
      if (action === 'PLAY_AZAN') {
        // User explicitly asked to (re)play the azan.
        playAzan();
        return;
      }
      // Tapping the notification body: open the app, leave azan playing as-is.
      maybeAlarm(data);
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!checked || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F6B4F' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  // Splash (Get Started/Skip) only shows on first launch — once onboarded,
  // the app opens directly without it.
  if (!onboarded && !splashed) {
    return <Splash onDone={() => setSplashed(true)} />;
  }

  if (!onboarded) {
    return (
      <>
        <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
        <Onboarding onDone={() => setOnboarded(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="surah/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="fajr-alarm" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <Inner />
        </AuthProvider>
      </SettingsProvider>
    </RootErrorBoundary>
  );
}
