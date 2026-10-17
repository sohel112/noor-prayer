import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * OAuth callback handler for noor://auth/callback deep links.
 * The actual session is set in signInWithGoogle() by parsing the URL.
 * This route just redirects to home to avoid "Unmatched Route" errors.
 */
export default function AuthCallback() {
  useEffect(() => {
    // Give the auth logic a moment to process, then go home.
    const t = setTimeout(() => router.replace('/'), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1D13' }}>
      <ActivityIndicator size="large" color="#D4AF7C" />
    </View>
  );
}
