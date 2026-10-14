import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings, Lang, ThemeMode, DEFAULT_SETTINGS } from '../lib/settings';
import { t } from '../lib/i18n';
import { PRAYER_METHODS } from '../lib/prayerTimes';
import { setJSON } from '../lib/storage';

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
            options={[{ v: 'en', label: 'English' }, { v: 'ur', label: 'اردو' }, { v: 'hi', label: 'हिन्दी' }]}
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
            options={[{ v: 'en', label: 'English' }, { v: 'ur', label: 'اردو' }, { v: 'hi', label: 'हिन्दी' }]}
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
          <Sub style={{ marginTop: 8 }}>Azan sound</Sub>
          <Seg
            options={[
              { v: 'azan1', label: 'Azan 1' },
              { v: 'azan2', label: 'Azan 2' },
              { v: 'silent', label: 'Silent (vibration)' },
            ]}
            value={settings.azanSound} onPick={v => update({ azanSound: v })}
          />
        </Card>

        <Card>
          <Sub style={styles.head}>🔋 Keep prayer alerts reliable</Sub>
          <Sub>
            On Xiaomi, Samsung, Oppo, Vivo and Huawei phones, the system may kill background
            alerts to save battery. Do this once:
          </Sub>
          <Sub style={{ marginTop: 8 }}>
            {'1. Settings → Apps → Noor → Battery → "Unrestricted" (or "Don't optimize").\n'}
            {'2. Turn OFF any "battery saver" restriction for Noor.\n'}
            {'3. On Xiaomi: also enable "Autostart" for Noor.\n'}
            {'4. Keep notifications allowed for Noor in system settings.'}
          </Sub>
          <Sub style={{ marginTop: 8 }}>
            If an azan alert ever doesn't ring, this setting is the cause 99% of the time —
            the app itself doesn't need to stay open.
          </Sub>
        </Card>

        <Card>
          <Sub style={styles.head}>What we track</Sub>
          <Sub>{t('privacyNote', lang)}</Sub>
          <Sub style={{ marginTop: 8 }}>• Location: stored only on your phone, used for prayer times & Qibla.{'\n'}• No analytics SDK. No advertising ID collection.{'\n'}• Mosque search goes to OpenStreetMap (their privacy policy applies).{'\n'}• Quran audio streams from the licensed source you choose.</Sub>
        </Card>

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
});
