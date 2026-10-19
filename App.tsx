// NEET MCQ Prep — App entry. Providers: Settings → Auth → Navigation.

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from './src/lib/settings';
import { DARK } from './src/lib/theme';
import { initCrashHandler } from './src/lib/crashLog';
import { AuthProvider } from './src/lib/auth';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Custom crash reporter (roadmap P0 #1) — records fatal JS errors locally,
// viewable in Settings → Diagnostics. Installed before anything renders.
initCrashHandler();

function ThemedStatusBar() {
  // Use the RESOLVED theme (handles 'auto' mode following the system).
  const { theme } = useSettings();
  return <StatusBar style={theme === DARK ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <ThemedStatusBar />
            <RootNavigator />
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
