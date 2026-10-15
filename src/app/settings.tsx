import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings, Lang, ThemeMode, DEFAULT_SETTINGS } from '../lib/settings';
import { t, LANGS } from '../lib/i18n';
import { PRAYER_METHODS } from '../lib/prayerTimes';
import { setJSON } from '../lib/storage';
import { playAzan } from '../lib/azanPlayer';
import { requestBatteryExemption } from '../lib/notifications';
import { useAuth } from '../lib/auth';
import { getSyncMeta, syncAll, type SyncMeta } from '../lib/sync';

function BackupSyncCard() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { configured, user, signOut } = useAuth();
  const [meta, setMeta] = useState<SyncMeta>({ lastSync: null, lastError: null });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { getSyncMeta().then(setMeta); }, [user]);

  const doSync = async () => {
    setSyncing(true);
    const err = await syncAll();
    const m = await getSyncMeta();
    setMeta(m);
    setSyncing(false);
    if (err) Alert.alert(t('backupSync', lang), err);
  };

  const doSignOut = () => {
    Alert.alert(t('signOut', lang), t('signOutConfirm', lang), [
      { text: 'Cancel', style: 'cancel' },
      { text: t('signOut', lang), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const lastSyncText = meta.lastSync
    ? new Date(meta.lastSync).toLocaleString()
    : t('neverSynced', lang);

  return (
    <Card>
      <Sub style={styles.head}>☁️ {t('backupSync', lang)}</Sub>
      {!configured ? (
        <View>
          <Sub>{t('cloudNotSetup', lang)}</Sub>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: th.accent, marginTop: 10 }]}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: th.onAccent, fontWeight: '700' }}>{t('signIn', lang)} / Sign Up →</Text>
          </TouchableOpacity>
        </View>
      ) : !user ? (
        <View>
          <Sub>{t('notSignedIn', lang)}</Sub>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: th.accent, marginTop: 10 }]}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: th.onAccent, fontWeight: '700' }}>{t('signIn', lang)} →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Sub>{t('loggedInAs', lang)}: <Text style={{ color: th.text, fontWeight: '700' }}>{user.email}</Text></Sub>
          <Sub style={{ marginTop: 6 }}>{t('lastSync', lang)}: {lastSyncText}</Sub>
          {meta.lastError ? <Sub style={{ color: '#E74C3C', marginTop: 4 }}>{meta.lastError}</Sub> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: th.accent, flex: 1, marginTop: 0 }]}
              onPress={doSync} disabled={syncing}
            >
              {syncing
                ? <ActivityIndicator color={th.onAccent} />
                : <Text style={{ color: th.onAccent, fontWeight: '700' }}>🔄 {t('syncNow', lang)}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testBtn, { borderColor: '#C0392B', borderWidth: 1, flex: 1, marginTop: 0 }]}
              onPress={doSignOut}
            >
              <Text style={{ color: '#C0392B', fontWeight: '700' }}>{t('signOut', lang)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Sub style={{ marginTop: 8, fontSize: 12 }}>🔒 {t('privacyNote', lang)}</Sub>
    </Card>
  );
}

export default function Settings() {
  const { settings, update } = useSettings();
  const th = useTheme();
  const lang = settings.lang;

  const resetAll = () => {
    Alert.alert('Reset settings?', 'All app settings will return to defaults.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => update({ ...DEFAULT_SETTINGS, lang: settings.lang }) },
    ]);
  };

  const Seg = <T extends string>({ options, value, onPick }: {
    options: { v: T; label: string }[]; value: T; onPick: (v: T) => void;
  }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map(o => (
        <TouchableOpacity key={o.v} onPress={() => onPick(o.v)}
          style={[styles.chip, { borderColor: th.border, backgroundColor: value === o.v ? th.accent : th.card }]}>
          <Text style={{ color: value === o.v ? '#fff' : th.text, fontWeight: '600', fontSize: 13 }}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Screen>
      <Scroller>
        <Title>⚙️ {t('settings', lang)}</Title>

        <Card>
          <Sub style={styles.head}>{t('language', lang)}</Sub>
          <Seg<Lang>
            options={LANGS.map(l => ({ v: l.code, label: `${l.flag} ${l.name}` }))}
            value={settings.lang} onPick={v => update({ lang: v })}
          />
        </Card>

        <Card>
          <Sub style={styles.head}>{t('theme', lang)}</Sub>
          <Seg<ThemeMode>
            options={[{ v: 'light', label: t('light', lang) }, { v: 'dark', label: t('dark', lang) }]}
            value={settings.theme} onPick={v => update({ theme: v })}
          />
          <Sub style={[styles.head, { marginTop: 12 }]}>Quran translation</Sub>
          <Seg<Lang>
            options={LANGS.map(l => ({ v: l.code, label: `${l.flag} ${l.name}` }))}
            value={settings.translation} onPick={v => update({ translation: v })}
          />
          <Sub style={[styles.head, { marginTop: 12 }]}>Clock</Sub>
          <Seg options={[{ v: '12', label: '12h' }, { v: '24', label: '24h' }]}
            value={settings.use24h ? '24' : '12'} onPick={v => update({ use24h: v === '24' })} />
        </Card>

        <Card>
          <Sub style={styles.head}>{t('calcMethod', lang)}</Sub>
          {PRAYER_METHODS.map(m => (
            <TouchableOpacity key={m.id} onPress={() => update({ methodId: m.id })} style={styles.line}>
              <Text style={{ color: th.text, fontSize: 15 }}>{m.name}</Text>
              <Text style={{ color: th.accent, fontSize: 16 }}>{settings.methodId === m.id ? '✓' : ''}</Text>
            </TouchableOpacity>
          ))}
          <Sub style={[styles.head, { marginTop: 10 }]}>Asr calculation</Sub>
          <Seg options={[{ v: 'shafi', label: 'Shafi (shadow ×1)' }, { v: 'hanafi', label: 'Hanafi (shadow ×2)' }]}
            value={settings.asrJuristic} onPick={v => update({ asrJuristic: v as 'shafi' | 'hanafi' })} />
          <Sub style={[styles.head, { marginTop: 10 }]}>High-latitude rule</Sub>
          <Seg
            options={[
              { v: 'angle', label: 'Angle-based' },
              { v: 'midnight', label: 'Middle of night' },
              { v: 'oneseventh', label: '1/7th of night' },
            ]}
            value={settings.highLatitudeRule}
            onPick={v => update({ highLatitudeRule: v as 'angle' | 'midnight' | 'oneseventh' })}
          />
        </Card>

        <Card>
          <Sub style={styles.head}>🕌 Match masjid azan times</Sub>
          <Sub>
            Calculated times can differ from your local masjid by a few minutes.
            Adjust each prayer here to match your masjid's azan — alerts will ring at the adjusted time.
          </Sub>
          {[['fajr', 'Fajr'], ['sunrise', 'Sunrise'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']].map(([key, label]) => {
            const adj = settings.adjustments[key] ?? 0;
            const setAdj = (v: number) => update({ adjustments: { ...settings.adjustments, [key]: v } });
            return (
              <View key={key} style={[styles.line, { justifyContent: 'space-between' }]}>
                <Text style={{ color: th.text, fontSize: 15 }}>{label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity onPress={() => setAdj(adj - 1)}
                    style={[styles.chip, { borderColor: th.border, paddingHorizontal: 12 }]}>
                    <Text style={{ color: th.text, fontSize: 16 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ color: th.text, fontSize: 15, minWidth: 60, textAlign: 'center', fontWeight: '600' }}>
                    {adj === 0 ? 'exact' : `${adj > 0 ? '+' : ''}${adj} min`}
                  </Text>
                  <TouchableOpacity onPress={() => setAdj(adj + 1)}
                    style={[styles.chip, { borderColor: th.border, paddingHorizontal: 12 }]}>
                    <Text style={{ color: th.text, fontSize: 16 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          <Sub style={styles.head}>{t('quietHours', lang)}</Sub>
          <Sub>No prayer alerts between these times (Fajr always alerts).</Sub>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[['22:00', '10 PM'], ['23:00', '11 PM']].map(([v, l]) => (
              <TouchableOpacity key={v} onPress={() => update({ quietFrom: v })}
                style={[styles.chip, { borderColor: th.border, backgroundColor: settings.quietFrom === v ? th.accent : th.card }]}>
                <Text style={{ color: settings.quietFrom === v ? '#fff' : th.text }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Sub style={{ marginTop: 8 }}>Alert sound</Sub>
          <Seg
            options={[
              { v: 'default', label: 'Default alert' },
              { v: 'silent', label: 'Silent (vibration)' },
            ]}
            value={settings.azanSound === 'silent' ? 'silent' : 'default'}
            onPick={v => update({ azanSound: v })}
          />
          <Sub style={{ marginTop: 6 }}>
            When a prayer alert arrives, Deen plays the azan automatically.
          </Sub>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: th.accentSoft, borderColor: th.accent }]}
            onPress={() => playAzan()}
          >
            <Text style={{ color: th.accent, fontWeight: '700' }}>🔊 Test azan sound</Text>
          </TouchableOpacity>

          {/* Fajr force-wake alarm */}
          <TouchableOpacity
            onPress={() => update({ fajrForceWake: !settings.fajrForceWake })}
            style={[styles.testBtn, {
              backgroundColor: settings.fajrForceWake ? th.accentSoft : 'transparent',
              borderColor: th.accent, marginTop: 10,
            }]}
          >
            <Text style={{ color: th.accent, fontWeight: '700', textAlign: 'center' }}>
              {settings.fajrForceWake ? '⏰ Fajr force-wake: ON' : '⏰ Fajr force-wake alarm'}
            </Text>
          </TouchableOpacity>
          <Sub style={{ marginTop: 6 }}>
            When ON, Fajr plays a loud alarm that rings even if your phone is on silent —
            tap Dismiss (or Snooze 10 min) to stop it. Keep battery exemption allowed above
            so it rings reliably.
          </Sub>
        </Card>

        <Card>
          <Sub style={styles.head}>🔋 Keep prayer alerts reliable</Sub>
          <Sub>
            On Xiaomi, Samsung, Oppo, Vivo and Huawei phones, the system may kill background
            alerts to save battery. Do this once:
          </Sub>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: th.accent, marginTop: 12 }]}
            onPress={() => requestBatteryExemption()}
          >
            <Text style={{ color: th.onAccent, fontWeight: '700' }}>Allow background azan (1 tap) →</Text>
          </TouchableOpacity>
          <Sub style={{ marginTop: 8 }}>
            Or manually: Settings → Apps → Deen → Battery → "Unrestricted".
          </Sub>
          <Sub style={{ marginTop: 8 }}>
            If an azan alert ever doesn't ring, this setting is the cause 99% of the time —
            the app itself doesn't need to stay open.
          </Sub>
        </Card>

        <Card>
          <Sub style={styles.head}>What we track</Sub>
          <Sub>{t('privacyNote', lang)}</Sub>
          <Sub style={{ marginTop: 8 }}>• Location: stored only on your phone, used for prayer times & Qibla.{'\n'}• No analytics SDK. No advertising ID collection.{'\n'}• Mosque search goes to OpenStreetMap (their privacy policy applies).{'\n'}• Quran audio streams from the licensed source you choose.{'\n'}• Cloud backup (if you sign in): only your prayer log, bookmarks, tasbih and settings — never sold, never shared.</Sub>
        </Card>

        <BackupSyncCard />

        <TouchableOpacity onPress={resetAll} style={[styles.danger, { borderColor: '#C0392B' }]}>
          <Text style={{ color: '#C0392B', fontWeight: '700' }}>Reset all settings</Text>
        </TouchableOpacity>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { fontWeight: '700', color: '#888', fontSize: 13, textTransform: 'uppercase' } as object,
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  danger: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  testBtn: { borderRadius: 12, padding: 12, marginTop: 10, alignItems: 'center', borderWidth: 1 },
});
