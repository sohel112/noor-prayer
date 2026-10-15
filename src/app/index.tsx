import { Redirect } from 'expo-router';

// Root index: hand off to the tab navigator.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
