import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { trackAppOpen } from '../lib/analytics';
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
import { playAzan, stopAzan, type AzanId } from '../lib/azanPlayer';
import { checkAppIntegrity, shouldAllowCloudSync } from '../lib/security';

function Inner() {
  const { settings } = useSettings();
  const [checked, setChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [splashed, setSplashed] = useState(false);
  const notifListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Analytics: track app open for DAU (privacy-first, opt-out in Settings).
    trackAppOpen();
    // Home-screen widget: push a fresh snapshot on every app start.
    import('../lib/widgetSync').then(m => m.syncPrayerWidget(true)).catch(() => {});
    // CRITICAL: Create notification channel with azan sound on EVERY app start.
    // Without this, killed-app notifications use the default channel (no azan sound).
    import('../lib/notifications').then(m => m.setupNotificationCategories()).catch(() => {});
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

  // Widget: refresh snapshot every time the app comes to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        import('../lib/widgetSync').then(m => m.syncPrayerWidget()).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // Azan auto-play: the azan now plays as the notification SOUND itself
  // (bundled via withAzanSounds plugin), so it rings even when the app is
  // killed — no tap needed. The in-app player is only for manual replay.
  // Force-wake Fajr notifications open the full-screen alarm instead.
  useEffect(() => {
    const azanId = (): AzanId => settings.azanSound === 'azan2' ? 'azan2' : 'azan1';
    const maybePlay = (data: any) => {
      // Notification sound handles auto-play now — skip in-app to avoid double audio.
      // Fajr force-wake: auto-open the full-screen alarm when the
      // notification ARRIVES (no tap needed) — azan starts immediately.
      if (data?.kind === 'fajr-force-wake') {
        try { router.push('/fajr-alarm'); } catch { /* ignore */ }
      }
    };
    const maybeAlarm = (data: any) => {
      if (data?.kind === 'fajr-force-wake') {
        // Open the full-screen Fajr alarm screen (plays azan).
        try { router.push('/fajr-alarm'); } catch { /* ignore */ }
        return true;
      }
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
        playAzan(azanId());
        return;
      }
      // Tapping the notification body: just open the app.
      // The azan already played as the notification sound; no replay needed.
      maybeAlarm(data);
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [settings.azanSound]);

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
