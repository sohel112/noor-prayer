import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { useLocation } from '../../lib/location';
import { qiblaBearing, qiblaDistanceKm } from '../../lib/qibla';

export default function Qibla() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc, useGps } = useLocation();
  const [heading, setHeading] = useState(0);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    Magnetometer.isAvailableAsync().then(ok => {
      if (!ok) { setAvailable(false); return; }
      Magnetometer.setUpdateInterval(200);
      sub = Magnetometer.addListener(data => {
        const h = Math.atan2(data.y, data.x) * (180 / Math.PI);
        setHeading((h + 360) % 360);
      });
    });
    return () => sub?.remove();
  }, []);

  if (!loc) {
    return (
      <Screen>
        <Scroller>
          <Title>🧭 {t('qibla', lang)}</Title>
          <Card>
            <Sub>Set your location first (Prayer tab) to use the Qibla compass.</Sub>
          </Card>
        </Scroller>
      </Screen>
    );
  }

  const bearing = qiblaBearing(loc.lat, loc.lng);
  const dist = qiblaDistanceKm(loc.lat, loc.lng);
  // rotate needle: needle points up when heading == bearing
  const rotation = bearing - heading;
  const aligned = Math.abs(((rotation + 540) % 360) - 180) < 5;

  return (
    <Screen>
      <Scroller>
        <Title>🧭 {t('qibla', lang)}</Title>
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          {!available ? (
            <Sub>This device has no compass sensor.</Sub>
          ) : (
            <>
              <View style={[styles.dial, { borderColor: th.border }]}>
                <Text style={{ fontSize: 14, color: th.sub, position: 'absolute', top: 8 }}>N</Text>
                <Text style={[styles.needle, { color: aligned ? th.accent : th.text,
                  transform: [{ rotate: `${rotation}deg` }] }]}>▲</Text>
                <Text style={{ fontSize: 40 }}>🕋</Text>
              </View>
              <Text style={[styles.deg, { color: aligned ? th.accent : th.text }]}>
                {Math.round(((rotation % 360) + 360) % 360)}°
              </Text>
              {aligned
                ? <Text style={{ color: th.accent, fontWeight: '700', fontSize: 16 }}>✓ Aligned — face this way</Text>
                : <Sub>Rotate your phone until the needle points up</Sub>}
              <Sub style={{ marginTop: 4 }}>Tip: wave your phone in a figure-8 to calibrate the sensor.</Sub>
            </>
          )}
        </Card>
        <Card>
          <Sub>Qibla bearing: <Text style={{ color: th.text, fontWeight: '700' }}>{bearing.toFixed(1)}°</Text></Sub>
          <Sub>Distance to Makkah: <Text style={{ color: th.text, fontWeight: '700' }}>{Math.round(dist).toLocaleString()} km</Text></Sub>
          <Sub>📍 {loc.label}</Sub>
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dial: {
    width: 220, height: 220, borderRadius: 110, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  needle: { fontSize: 34, position: 'absolute', top: 26 },
  deg: { fontSize: 32, fontWeight: '800', marginTop: 12 },
});
