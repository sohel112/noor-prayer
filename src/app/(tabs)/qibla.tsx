import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { Screen, Scroller, Card, Sub, useTheme, TopBar, Heading } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { useLocation } from '../../lib/location';
import { qiblaBearing, qiblaDistanceKm } from '../../lib/qibla';
import { router } from 'expo-router';
import { FONTS } from '../../lib/theme';

/** 16-wind compass names for a bearing in degrees. */
function compassPointName(bearing: number): string {
  const names = [
    'North', 'North-Northeast', 'Northeast', 'East-Northeast',
    'East', 'East-Southeast', 'Southeast', 'South-Southeast',
    'South', 'South-Southwest', 'Southwest', 'West-Southwest',
    'West', 'West-Northwest', 'Northwest', 'North-Northwest',
  ];
  return names[Math.round(bearing / 22.5) % 16];
}

const DIAL_SIZE = 250;
const DIAL_R = DIAL_SIZE / 2;

/** Static tick marks — built once, never re-created on sensor updates. */
const TICKS: { deg: number; label: string | null }[] = (() => {
  const arr: { deg: number; label: string | null }[] = [];
  for (let d = 0; d < 360; d += 15) {
    arr.push({
      deg: d,
      label: d === 0 ? 'N' : d === 90 ? 'E' : d === 180 ? 'S' : d === 270 ? 'W' : null,
    });
  }
  return arr;
})();

/**
 * Memoized compass dial — only re-renders when theme/bearing changes,
 * NOT on every sensor update. Rotation is driven by an Animated.Value
 * so the needle moves without any React re-render (zero lag).
 */
const CompassDial = memo(function CompassDial({
  bearing, dialAnim, th,
}: {
  bearing: number; dialAnim: Animated.Value; th: ReturnType<typeof useTheme>;
}) {
  const kaabaRad = (bearing * Math.PI) / 180;
  const kaabaX = DIAL_R + (DIAL_R - 44) * Math.sin(kaabaRad);
  const kaabaY = DIAL_R - (DIAL_R - 44) * Math.cos(kaabaRad);

  const rotate = dialAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['360deg', '-360deg'],
  });

  return (
    <View style={[styles.dial, { borderColor: th.accent, backgroundColor: th.card, shadowColor: th.shadow }]}>
      <Animated.View style={[styles.dialInner, { transform: [{ rotate }] }]}>
        {TICKS.map(tk => {
          const rad = (tk.deg * Math.PI) / 180;
          const x = DIAL_R + (DIAL_R - 16) * Math.sin(rad);
          const y = DIAL_R - (DIAL_R - 16) * Math.cos(rad);
          return (
            <View
              key={tk.deg}
              style={{
                position: 'absolute', left: x - 10, top: y - 10,
                width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
              }}
            >
              {tk.label ? (
                <Text style={{
                  color: tk.deg === 0 ? th.primary : th.text,
                  fontFamily: FONTS.bodyBold, fontSize: 18,
                }}>
                  {tk.label}
                </Text>
              ) : (
                <View style={{
                  width: tk.deg % 45 === 0 ? 3 : 1.5,
                  height: tk.deg % 45 === 0 ? 12 : 7,
                  backgroundColor: tk.deg % 45 === 0 ? th.accent : th.sub,
                  borderRadius: 1,
                }} />
              )}
            </View>
          );
        })}
        {/* Kaaba marker at the qibla bearing on the dial */}
        <Text style={{ position: 'absolute', left: kaabaX - 18, top: kaabaY - 18, fontSize: 36 }}>
          🕋
        </Text>
      </Animated.View>
      {/* Fixed gold marker at top = direction the phone is facing */}
      <View style={[styles.topMarker, { borderBottomColor: th.accent }]} />
      <View style={[styles.hub, { backgroundColor: th.card, borderColor: th.accent }]}>
        <View style={[styles.hubDot, { backgroundColor: th.primary }]} />
      </View>
    </View>
  );
});

export default function Qibla() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc } = useLocation();
  const [heading, setHeading] = useState(0);
  const [available, setAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Animated rotation value — updates the dial WITHOUT React re-renders (no lag).
  const dialAnimRef = useRef<Animated.Value | null>(null);
  if (dialAnimRef.current === null) dialAnimRef.current = new Animated.Value(0);
  const dialAnim = dialAnimRef.current;
  // Throttle text updates: only re-render when heading changes by 2°+.
  const lastTextHeading = useRef(0);
  // 60fps smoothing: sensor writes target, rAF loop eases the dial toward it.
  const targetDial = useRef(0);
  const currentDial = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    // Use DeviceMotion (rotation vector) instead of raw Magnetometer —
    // the raw magnetometer triggers Android's system calibration screen.
    DeviceMotion.isAvailableAsync().then(ok => {
      if (!ok) { setAvailable(false); return; }
      DeviceMotion.setUpdateInterval(30);
      sub = DeviceMotion.addListener(data => {
        const r = data.rotation;
        if (!r) return;
        // alpha = compass heading (0 = north), in radians
        const h = (r.alpha * 180) / Math.PI;
        const norm = (h + 360) % 360;
        targetDial.current = -norm;
      });
    });
    // Buttery 60fps loop — eases dial toward sensor target (shortest path).
    const tick = () => {
      const target = targetDial.current;
      const cur = currentDial.current;
      let diff = target - cur;
      diff = ((diff + 540) % 360) - 180; // shortest rotation
      const next = cur + diff * 0.3;
      currentDial.current = next;
      dialAnim.setValue(next);
      // Update text only when it meaningfully changed (saves re-renders).
      const normHeading = ((-next % 360) + 360) % 360;
      if (Math.abs(normHeading - lastTextHeading.current) >= 2) {
        lastTextHeading.current = normHeading;
        setHeading(normHeading);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      sub?.remove();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // Outlined "Calibrate" — genuinely re-reads the sensor for 2s, no overlay.
  const onCalibrate = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMsg('');
    DeviceMotion.setUpdateInterval(16); // read the sensor faster for 2s
    refreshTimer.current = setTimeout(() => {
      DeviceMotion.setUpdateInterval(30);
      setRefreshing(false);
      setRefreshMsg('Compass refreshed ✓');
    }, 2000);
  };

  if (!loc) {
    return (
      <Screen edges={['top']}>
        <TopBar title={t('qibla', lang)} />
        <Scroller>
          <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
            <Text style={{ fontSize: 48 }}>🧭</Text>
            <Heading size={22}>Find your Qibla</Heading>
            <Sub style={{ textAlign: 'center' }}>
              Set your location first so we can point the compass to Makkah.
            </Sub>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/more')}
              activeOpacity={0.85}
              style={[styles.outlineBtn, { borderColor: th.primary, marginTop: 8 }]}
            >
              <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 16 }}>
                Set Location
              </Text>
            </TouchableOpacity>
          </Card>
        </Scroller>
      </Screen>
    );
  }

  const bearing = qiblaBearing(loc.lat, loc.lng);
  const dist = qiblaDistanceKm(loc.lat, loc.lng);
  const aligned = Math.abs(((bearing - heading + 540) % 360) - 180) < 5;

  return (
    <Screen edges={['top']}>
      <TopBar title={t('qibla', lang)} />
      <Scroller>
        <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
          {!available ? (
            <Sub>This device has no compass sensor.</Sub>
          ) : (
            <>
              <CompassDial bearing={bearing} dialAnim={dialAnim} th={th} />

              <Text style={[styles.dirLabel, { color: th.sub }]}>QIBLA DIRECTION</Text>
              <Heading size={44} style={{ marginBottom: 0 }}>{Math.round(bearing)}°</Heading>
              <Text style={{ color: th.accent, fontFamily: FONTS.bodySemi, fontSize: 17, marginTop: 2 }}>
                {compassPointName(bearing)}
              </Text>
              {aligned
                ? <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 15, marginTop: 8 }}>✓ Aligned — face this way</Text>
                : <Sub style={{ marginTop: 8 }}>Rotate your phone until 🕋 reaches the top</Sub>}
              {refreshMsg ? (
                <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 14, marginTop: 8 }}>
                  {refreshMsg}
                </Text>
              ) : null}
            </>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={[styles.infoTile, { flex: 1, alignItems: 'center' }]}>
            <Text style={[styles.infoLabel, { color: th.accent }]}>DISTANCE</Text>
            <Text style={[styles.infoValue, { color: th.text }]}>
              {Math.round(dist).toLocaleString()} km
            </Text>
          </Card>
          <Card style={[styles.infoTile, { flex: 1, alignItems: 'center' }]}>
            <Text style={[styles.infoLabel, { color: th.accent }]}>LOCATION</Text>
            <Text style={[styles.infoSub, { color: th.text }]} numberOfLines={2}>
              {loc.label}
            </Text>
          </Card>
        </View>

        <TouchableOpacity
          onPress={onCalibrate}
          activeOpacity={0.85}
          disabled={refreshing || !available}
          style={[
            styles.outlineBtn,
            { borderColor: th.primary, opacity: refreshing || !available ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 16 }}>
            {refreshing ? 'Refreshing…' : '🧭 Calibrate'}
          </Text>
        </TouchableOpacity>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dial: {
    width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_R, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  dialInner: { width: DIAL_SIZE, height: DIAL_SIZE, position: 'absolute' },
  topMarker: {
    position: 'absolute', top: 6,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  hub: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  hubDot: { width: 10, height: 10, borderRadius: 5 },
  dirLabel: {
    fontSize: 12, fontFamily: FONTS.bodySemi, letterSpacing: 2.5, marginTop: 18,
  },
  infoTile: { paddingVertical: 18 },
  infoLabel: { fontSize: 11, fontFamily: FONTS.bodyBold, letterSpacing: 2.5 },
  infoValue: { fontSize: 22, fontFamily: FONTS.bodyBold, marginTop: 6, fontVariant: ['tabular-nums'] },
  infoSub: { fontSize: 15, fontFamily: FONTS.bodyMedium, marginTop: 8, textAlign: 'center' },
  outlineBtn: {
    borderWidth: 2, borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
});
