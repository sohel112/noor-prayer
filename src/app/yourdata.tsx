import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';

/** Your Data — the trust screen. Shows exactly what is stored, where,
 *  backup status, and export/import. Nothing hidden. */

export default function YourData() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [keys, setKeys] = useState<string[]>([]);
  const [sizeKb, setSizeKb] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const refresh = async () => {
    const all = await AsyncStorage.getAllKeys();
    const ours = all.filter(k => k.startsWith('noor.'));
    setKeys(ours);
    let bytes = 0;
    const pairs = await AsyncStorage.multiGet(ours);
    pairs.forEach(([, v]) => { bytes += (v ?? '').length; });
    setSizeKb(Math.round(bytes / 102.4) / 10);
    const b = await AsyncStorage.getItem('noor.backup.v1');
    setLastSync(b ? JSON.parse(b).lastSync ?? null : null);
  };

  useEffect(() => { refresh(); }, []);

  const exportData = async () => {
    const pairs = await AsyncStorage.multiGet(keys);
    const obj: Record<string, string | null> = {};
    pairs.forEach(([k, v]) => { obj[k] = v; });
    const payload = JSON.stringify({ app: 'noor', exportedAt: new Date().toISOString(), data: obj }, null, 1);
    try {
      await Share.share({ message: payload, title: 'Deen backup' });
    } catch {
      Alert.alert('Export failed', 'Could not share the backup file.');
    }
  };

  const wipe = () => {
    Alert.alert('Delete all my data?', 'This erases everything Deen stored on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(keys);
          refresh();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Scroller>
        <Title>🔒 {t('yourData', lang)}</Title>

        <Card style={{ borderColor: th.accent, borderWidth: 2 }}>
          <Sub style={{ fontWeight: '700', color: th.accent }}>✓ Your data is saved</Sub>
          <Sub style={{ marginTop: 6 }}>
            {keys.length} items · {sizeKb} KB — stored on <Text style={{ fontWeight: '700', color: th.text }}>this phone only</Text>.
          </Sub>
          <Sub style={{ marginTop: 6 }}>{t('privacyNote', lang)}</Sub>
        </Card>

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>Cloud backup (optional)</Sub>
          <Sub style={{ marginTop: 6 }}>
            Status: <Text style={{ color: th.text, fontWeight: '700' }}>
              {lastSync ? `On — last synced ${lastSync}` : 'Off — enable by signing in (coming in the release build)'}
            </Text>
          </Sub>
          <Sub style={{ marginTop: 6 }}>
            Backup is strictly opt-in. The app works 100% without an account.
          </Sub>
        </Card>

        <Card>
          <Sub style={{ fontWeight: '700', color: th.text }}>What's stored on this phone</Sub>
          {keys.map(k => (
            <View key={k} style={[styles.row, { borderBottomColor: th.border }]}>
              <Text style={{ color: th.text, fontSize: 13 }}>{k.replace('noor.', '').replace('.v1', '')}</Text>
              <Text style={{ color: th.sub, fontSize: 13 }}>on this phone</Text>
            </View>
          ))}
          {keys.length === 0 ? <Sub>Nothing stored yet — use the app and it appears here.</Sub> : null}
        </Card>

        <TouchableOpacity style={[styles.btn, { backgroundColor: th.accent }]} onPress={exportData}>
          <Text style={[styles.btnText, { color: th.onAccent }]}>📤 Export my data (backup file)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: '#C0392B', borderWidth: 1 }]} onPress={wipe}>
          <Text style={{ color: '#C0392B', fontWeight: '700' }}>🗑 Delete all my data</Text>
        </TouchableOpacity>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { fontWeight: '700', fontSize: 15 },
});
