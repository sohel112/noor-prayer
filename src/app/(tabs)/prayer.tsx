import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, RowButton, useTheme } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { useLocation } from '../../lib/location';
import { calculatePrayerTimes, formatTime, PRAYER_METHODS, PrayerTimes } from '../../lib/prayerTimes';
import { reschedulePrayerNotifications } from '../../lib/notifications';

const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export default function Prayer() {
  const { settings, update } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc, loading, useGps, save } = useLocation();
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showMethod, setShowMethod] = useState(false);

  const times: PrayerTimes | null = useMemo(() => {
    if (!loc) return null;
    return calculatePrayerTimes(new Date(), loc.lat, loc.lng, {
      methodId: settings.methodId,
      asrJuristic: settings.asrJuristic,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.adjustments,
      dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
    });
  }, [loc, settings]);

  const onGps = async () => {
    const ok = await useGps();
    if (!ok) Alert.alert('Permission needed', 'Please allow location access in system settings.');
  };

  const onManual = () => {
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      Alert.alert('Invalid', 'Enter numeric latitude & longitude.');
      return;
    }
    save({ lat: la, lng: ln, label: city.trim() || `${la.toFixed(2)}, ${ln.toFixed(2)}`, source: 'manual' });
    setCity(''); setLat(''); setLng('');
  };

  const toggleNotif = (k: string) => {
    const next = { ...settings.notifications, [k]: !settings.notifications[k] };
    update({ notifications: next });
  };

  return (
    <Screen>
      <Scroller>
        <Title>🕌 {t('prayer', lang)}</Title>

        {!loc && !loading ? (
          <Card>
            <Sub>Set your location — prayer times are calculated on your phone, nothing is uploaded.</Sub>
            <TouchableOpacity style={[styles.cta, { backgroundColor: th.accent }]} onPress={onGps}>
              <Text style={styles.ctaText}>📍 Use GPS location</Text>
            </TouchableOpacity>
            <Sub style={{ marginTop: 12, marginBottom: 6 }}>Or enter manually:</Sub>
            <TextInput placeholder="City name" value={city} onChangeText={setCity}
              style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]} placeholderTextColor={th.sub} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput placeholder="Lat" value={lat} onChangeText={setLat} keyboardType="numeric"
                style={[styles.input, { flex: 1, color: th.text, borderColor: th.border, backgroundColor: th.bg }]} placeholderTextColor={th.sub} />
              <TextInput placeholder="Lng" value={lng} onChangeText={setLng} keyboardType="numeric"
                style={[styles.input, { flex: 1, color: th.text, borderColor: th.border, backgroundColor: th.bg }]} placeholderTextColor={th.sub} />
            </View>
            <TouchableOpacity style={[styles.cta, { backgroundColor: th.accent, marginTop: 8 }]} onPress={onManual}>
              <Text style={styles.ctaText}>Save location</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {loc && times ? (
          <Card>
            <Sub>📍 {loc.label}</Sub>
            {ORDER.map(k => (
              <View key={k} style={[styles.row, { borderBottomColor: th.border }]}>
                <Text style={{ color: th.text, fontSize: 16, fontWeight: '600' }}>{t(k, lang)}</Text>
                <Text style={{ color: th.accent, fontSize: 16, fontWeight: '700' }}>
                  {formatTime(times[k], settings.use24h)}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={async () => {
                const tomorrow = calculatePrayerTimes(new Date(Date.now() + 86400000), loc.lat, loc.lng, {
                  methodId: settings.methodId, asrJuristic: settings.asrJuristic,
                  highLatitudeRule: settings.highLatitudeRule, adjustments: settings.adjustments,
                  dhuhrOffsetMinutes: settings.dhuhrOffsetMinutes,
                });
                await reschedulePrayerNotifications(times, tomorrow, settings);
                Alert.alert('Done', 'Prayer alerts scheduled for today & tomorrow.');
              }}
              style={[styles.cta, { backgroundColor: th.accent, marginTop: 8 }]}
            >
              <Text style={styles.ctaText}>🔔 Schedule prayer alerts</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>{t('calcMethod', lang)}</Sub>
          <TouchableOpacity onPress={() => setShowMethod(!showMethod)} style={{ marginTop: 8 }}>
            <Text style={{ color: th.accent, fontSize: 16, fontWeight: '600' }}>
              {PRAYER_METHODS.find(m => m.id === settings.methodId)?.name} ▾
            </Text>
          </TouchableOpacity>
          {showMethod && PRAYER_METHODS.map(m => (
            <TouchableOpacity key={m.id} onPress={() => { update({ methodId: m.id }); setShowMethod(false); }}
              style={{ paddingVertical: 8 }}>
              <Text style={{ color: settings.methodId === m.id ? th.accent : th.text, fontSize: 15 }}>
                {settings.methodId === m.id ? '✓ ' : ''}{m.name}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={() => update({ asrJuristic: 'shafi' })}
              style={[styles.chip, { borderColor: th.border, backgroundColor: settings.asrJuristic === 'shafi' ? th.accentSoft : 'transparent' }]}>
              <Text style={{ color: th.text }}>Asr: Shafi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => update({ asrJuristic: 'hanafi' })}
              style={[styles.chip, { borderColor: th.border, backgroundColor: settings.asrJuristic === 'hanafi' ? th.accentSoft : 'transparent' }]}>
              <Text style={{ color: th.text }}>Asr: Hanafi</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>{t('notifications', lang)} (per prayer)</Sub>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k => (
            <TouchableOpacity key={k} onPress={() => toggleNotif(k)} style={styles.toggleRow}>
              <Text style={{ color: th.text, fontSize: 15 }}>{t(k, lang)}</Text>
              <Text style={{ fontSize: 20 }}>{settings.notifications[k] ? '🔔' : '🔕'}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
