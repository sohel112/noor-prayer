import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { useLocation } from '../lib/location';

interface Mosque { name: string; lat: number; lng: number; distKm: number; }

// Zero-cost: OpenStreetMap Overpass API, queried client-side (each phone = own IP).
// Results cached in-memory per session to respect fair use.
let cache: { key: string; at: number; data: Mosque[] } | null = null;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, dLa = (lat2 - lat1) * Math.PI / 180, dLn = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Mosques() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc } = useLocation();
  const [results, setResults] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!loc) return;
    const key = `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
    if (cache && cache.key === key && Date.now() - cache.at < 3600000) {
      setResults(cache.data);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const query = `[out:json];node["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${loc.lat},${loc.lng});out body;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error('server busy');
      const json = await res.json();
      const list: Mosque[] = (json.elements ?? []).map((e: any) => ({
        name: e.tags?.name ?? 'Mosque',
        lat: e.lat,
        lng: e.lon,
        distKm: haversine(loc.lat, loc.lng, e.lat, e.lon),
      })).sort((a: Mosque, b: Mosque) => a.distKm - b.distKm).slice(0, 30);
      cache = { key, at: Date.now(), data: list };
      setResults(list);
    } catch {
      setError('Could not reach the mosque directory right now. Try again in a bit — results are cached once loaded.');
    } finally {
      setLoading(false);
    }
  };

  const openMap = (m: Mosque) => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}#map=16/${m.lat}/${m.lng}`);
  };

  return (
    <Screen>
      <Scroller>
        <Title>🕌 {t('mosques', lang)}</Title>
        {!loc ? (
          <Card><Sub>Set your location first (Prayer tab).</Sub></Card>
        ) : (
          <Card>
            <Sub>📍 {loc.label} · within 8 km · free OpenStreetMap data</Sub>
            <TouchableOpacity style={[styles.cta, { backgroundColor: th.accent }]} onPress={search} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? 'Searching…' : '🔍 Find nearby mosques'}</Text>
            </TouchableOpacity>
            {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={th.accent} /> : null}
            {error ? <Sub style={{ marginTop: 8 }}>{error}</Sub> : null}
          </Card>
        )}
        {results.map((m, i) => (
          <TouchableOpacity key={i} onPress={() => openMap(m)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 16, fontWeight: '600' }}>{m.name}</Text>
                <Sub>{m.distKm.toFixed(1)} km away · tap for map</Sub>
              </View>
              <Text style={{ fontSize: 20 }}>🗺️</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
