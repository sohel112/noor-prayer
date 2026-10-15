import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { useLocation } from '../lib/location';

interface Mosque { name: string; lat: number; lng: number; distKm: number; }

// Zero-cost: OpenStreetMap Overpass API, queried client-side (each phone = own IP).
// Multiple mirrors with fallback — if one is down/busy, try the next.
// Results cached persistently (AsyncStorage, 7 days) + in-memory for the session.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];
const FETCH_TIMEOUT_MS = 30000;
const CACHE_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days

let memCache: { key: string; at: number; data: Mosque[] } | null = null;

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
    const cacheKey = `mosques:${key}`;

    // 1. In-memory cache (session)
    if (memCache && memCache.key === key && Date.now() - memCache.at < 3600000) {
      setResults(memCache.data);
      return;
    }
    // 2. Persistent cache (AsyncStorage, 7 days)
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const saved = JSON.parse(raw) as { at: number; data: Mosque[] };
        if (Date.now() - saved.at < CACHE_TTL_MS && saved.data.length > 0) {
          memCache = { key, at: Date.now(), data: saved.data };
          setResults(saved.data);
          return;
        }
      }
    } catch { /* cache read failure is non-fatal */ }

    setLoading(true);
    setError('');

    // Query nodes + ways + relations (ways/relations need "out center" for coords).
    // Also match mosques tagged only with building=mosque (common in some regions).
    const query = `[out:json][timeout:25];(`
      + `node["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${loc.lat},${loc.lng});`
      + `way["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${loc.lat},${loc.lng});`
      + `node["building"="mosque"](around:8000,${loc.lat},${loc.lng});`
      + `way["building"="mosque"](around:8000,${loc.lat},${loc.lng});`
      + `);out center;`;

    let lastErr: unknown = null;
    for (const mirror of OVERPASS_MIRRORS) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(mirror, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`server ${res.status}`);
        const json = await res.json();
        const seen = new Set<string>();
        const list: Mosque[] = [];
        for (const e of (json.elements ?? []) as any[]) {
          const lat = e.lat ?? e.center?.lat;
          const lng = e.lon ?? e.center?.lon;
          if (lat == null || lng == null) continue;
          const dedupe = `${lat.toFixed(4)},${lng.toFixed(4)}`;
          if (seen.has(dedupe)) continue;
          seen.add(dedupe);
          list.push({
            name: e.tags?.name ?? e.tags?.['name:en'] ?? 'Mosque',
            lat, lng,
            distKm: haversine(loc.lat, loc.lng, lat, lng),
          });
        }
        list.sort((a, b) => a.distKm - b.distKm);
        const top = list.slice(0, 30);
        memCache = { key, at: Date.now(), data: top };
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data: top }));
        } catch { /* cache write failure is non-fatal */ }
        setResults(top);
        if (top.length === 0) {
          setError('No mosques found within 8 km in OpenStreetMap data. The directory may be incomplete in your area.');
        }
        setLoading(false);
        return; // success — stop trying mirrors
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        // try next mirror
      }
    }

    // All mirrors failed
    setLoading(false);
    const isAbort = lastErr instanceof Error && lastErr.name === 'AbortError';
    setError(isAbort
      ? 'The mosque directory is taking too long to respond. Check your internet connection and try again.'
      : 'Could not reach the mosque directory right now. Check your internet connection and try again in a bit.');
  };

  const openMap = (m: Mosque) => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lng}#map=16/${m.lat}/${m.lng}`);
  };

  const openGoogleMaps = () => {
    if (!loc) return;
    // Google Maps mosque search near user location — better coverage in India.
    Linking.openURL(`https://www.google.com/maps/search/mosque/@${loc.lat},${loc.lng},14z`);
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
              <Text style={[styles.ctaText, { color: th.onAccent }]}>{loading ? 'Searching…' : '🔍 Find nearby mosques'}</Text>
            </TouchableOpacity>
            {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={th.accent} /> : null}
            {error ? <Sub style={{ marginTop: 8 }}>{error}</Sub> : null}
            {/* Google Maps fallback — better mosque coverage in many areas */}
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: th.primary, marginTop: 12 }]}
              onPress={openGoogleMaps}
            >
              <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>🗺️ Search mosques in Google Maps</Text>
            </TouchableOpacity>
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
  ctaText: { fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
