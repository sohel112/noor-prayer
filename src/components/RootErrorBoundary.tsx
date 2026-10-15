// Root error boundary — if anything crashes during render, show the actual
// error on screen instead of the app silently dying ("keeps stopping").
// This turns an invisible native crash dialog into a readable diagnostic.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[Deen] Root crash:', error?.message, error?.stack);
  }

  render() {
    if (this.state.error) {
      const e = this.state.error;
      return (
        <View style={styles.wrap}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Deen — kuch gadbad ho gayi</Text>
            <Text style={styles.sub}>App ko kholne me dikkat aayi. Is screen ka screenshot bhej dein taaki fix ho sake.</Text>
            <Text style={styles.err}>{String(e?.message || e)}</Text>
            <Text style={styles.stack}>{String(e?.stack || '').slice(0, 2000)}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B1D13' },
  scroll: { padding: 20, paddingTop: 60 },
  title: { color: '#3ECF7A', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sub: { color: '#9DB3A3', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  err: { color: '#F2EFE4', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  stack: { color: '#9DB3A3', fontSize: 11, lineHeight: 16 },
});
