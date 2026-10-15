// DEEN clean splash — light background, centered brand mark, tagline,
// green Get Started button + Skip. No auto-dismiss; the user taps through.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { DeenMark } from './ui';
import { FONTS } from '../lib/theme';

export default function Splash({ onDone }: { onDone: () => void }) {
  const [fade] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(28));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: rise }],
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: 40,
        }}
      >
        <DeenMark size={92} color="#0F6B4F" />
        <Text style={styles.tagline}>Closer to Allah Every Day</Text>
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.diamond}>✦</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.btn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    marginTop: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    gap: 10,
  },
  line: { width: 64, height: 1, backgroundColor: '#D4AF7C' },
  diamond: { color: '#D4AF7C', fontSize: 12 },
  btn: {
    backgroundColor: '#0F6B4F',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#0F6B4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FONTS.bodySemi,
    letterSpacing: 0.3,
  },
  skip: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 24 },
  skipText: { color: '#6B7280', fontSize: 15, fontFamily: FONTS.bodyMedium },
});
