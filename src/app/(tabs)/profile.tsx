// Profile screen — user identity, stats, account & cloud backup management.
// Design: clean light theme matching the rest of DEEN.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Screen, Scroller, Card, useTheme, Title, Sub, SectionTitle,
  RowButton, GoldButton,
} from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { useAuth } from '../../lib/auth';
import { getJSON } from '../../lib/storage';
import { getSyncMeta, pushAll, pullAll, type SyncMeta } from '../../lib/sync';
import { getSupabase } from '../../lib/supabase';
import { FONTS } from '../../lib/theme';
import { t } from '../../lib/i18n';
// ImagePicker loaded lazily to avoid native module crash on screen open
// AdBanner loaded lazily to avoid native module crash
const AdBanner = React.lazy(() => import('../../components/AdBanner').then(m => ({ default: m.AdBanner })));

interface Stats {
  streak: number;
  totalPrayers: number;
  tasbihTotal: number;
  bookmarks: number;
}

const EMPTY_STATS: Stats = { streak: 0, totalPrayers: 0, tasbihTotal: 0, bookmarks: 0 };

async function loadStats(): Promise<Stats> {
  try {
    const prayerLog = await getJSON<Record<string, Record<string, boolean>>>('prayerLog', {});
    const dates = Object.keys(prayerLog).sort().reverse();
    let streak = 0;
    let totalPrayers = 0;
    const today = new Date();
    // Streak: consecutive days (ending today or yesterday) with >= 4 prayers marked
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i] + 'T12:00:00');
      const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diffDays > i + 1) break; // gap in days
      const count = Object.values(prayerLog[dates[i]]).filter(Boolean).length;
      totalPrayers += count;
      if (count >= 4) streak++;
      else if (diffDays > 0) break;
    }
    // Count remaining (older) days for total
    for (let i = streak; i < dates.length; i++) {
      totalPrayers += Object.values(prayerLog[dates[i]]).filter(Boolean).length;
    }
    const tasbih = await getJSON<{ total: number }>('tasbih', { total: 0 });
    const tasbihTotal = tasbih.total || 0;
    const bookmarks = (await getJSON<string[]>('bookmarks', [])).length;
    return { streak, totalPrayers, tasbihTotal, bookmarks };
  } catch {
    return EMPTY_STATS;
  }
}

interface Tool { label: string; icon: string; route: string }

const TOOLS: Tool[] = [
  { label: 'Makkah Live', icon: '🕋', route: '/makkah' },
  { label: 'Mosque Finder', icon: '🕌', route: '/mosques' },
  { label: 'Halal Food', icon: '🍖', route: '/halal-food' },
  { label: 'Zakat Calculator', icon: '💰', route: '/zakat' },
  { label: '99 Names', icon: '✨', route: '/names' },
  { label: 'Hadith', icon: '📜', route: '/hadith' },
  { label: 'Tasbih', icon: '📿', route: '/tasbih' },
  { label: 'Ramadan', icon: '🌙', route: '/ramadan' },
  { label: 'Qibla', icon: '🧭', route: '/qibla' },
  { label: 'Waris Calculator', icon: '⚖️', route: '/waris' },
  { label: 'Hijri Converter', icon: '🔄', route: '/converter' },
  { label: 'Adhkar', icon: '🌅', route: '/adhkar' },
  { label: 'Fajr Alarm', icon: '⏰', route: '/fajr-alarm-settings' },
  { label: 'Namaz Guide', icon: '🙏', route: '/namaz-guide' },
  { label: 'Islamic Quiz', icon: '❓', route: '/quiz' },
  { label: 'Hifz Planner', icon: '🧠', route: '/hifz-planner' },
  { label: 'Battery Guide', icon: '🔋', route: '/battery' },
];

function StatBox({ value, label, icon }: { value: string; label: string; icon: string }) {
  const th = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: th.chip }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{ color: th.text, fontSize: 20, fontFamily: FONTS.bodySemi, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ color: th.sub, fontSize: 11, fontFamily: FONTS.body, marginTop: 2, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

export default function Profile() {
  const th = useTheme();
  const { settings } = useSettings();
  const lang = settings.lang;
  const { user, signOut, configured } = useAuth();

  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [syncMeta, setSyncMeta] = useState<SyncMeta>({ lastSync: null, lastError: null });
  const [syncing, setSyncing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const currentName = (typeof meta?.full_name === 'string' && meta.full_name)
    || (typeof meta?.display_name === 'string' && meta.display_name)
    || user?.email?.split('@')[0]
    || 'Guest User';
  const [displayName, setDisplayName] = useState(currentName);
  const email = user?.email ?? null;
  const initial = currentName === 'Guest User' ? '👤' : currentName.charAt(0).toUpperCase();

  const refresh = useCallback(async () => {
    setStats(await loadStats());
    setSyncMeta(await getSyncMeta());
    // Load avatar from profiles table
    if (user) {
      try {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.from('profiles').select('avatar_url').eq('id', user.id).single();
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } catch { /* ignore */ }
    }
  }, [user]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const doSync = async () => {
    if (!user) {
      Alert.alert(t('signIn', lang), t('loginSub', lang));
      return;
    }
    setSyncing(true);
    const err = await pushAll();
    if (!err) await pullAll();
    setSyncing(false);
    await refresh();
    Alert.alert(
      err ? 'Sync failed' : 'Synced ✓',
      err ?? 'Your data is backed up to the cloud.',
    );
  };

  const saveName = async () => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert('Name', 'Please enter a name.');
      return;
    }
    setSavingName(true);
    try {
      const sb = getSupabase();
      if (sb && user) {
        const { error } = await sb.auth.updateUser({ data: { full_name: name, display_name: name } });
        if (error) throw error;
      }
      // For guests, the name is only shown in this session (no storage key needed)
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again.');
    } finally {
      setSavingName(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Your local data stays on this device. Cloud backup will pause until you sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const pickAvatar = async () => {
    if (!user) {
      Alert.alert(t('signIn', lang) ?? 'Sign in', t('loginSub', lang) ?? 'Please sign in to add a profile picture.');
      return;
    }
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to set a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploadingAvatar(true);
      const uri = result.assets[0].uri;
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase not configured');
      const response = await fetch(uri);
      const blob = await response.blob();
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await sb.storage.from('avatars').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: dbErr } = await sb.from('profiles').upsert(
        { id: user.id, avatar_url: publicUrl },
        { onConflict: 'id' }
      );
      if (dbErr) throw dbErr;
      setAvatarUrl(publicUrl);
      Alert.alert('Profile picture', 'Updated! 📸');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const lastSyncText = syncMeta.lastSync
    ? new Date(syncMeta.lastSync).toLocaleString()
    : 'Never';

  return (
    <Screen edges={['top']}>
      <Scroller>
        <Title>{t('profile', lang) ?? 'Profile'}</Title>
        {/* Header card */}
        <Card>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={{ position: 'relative' }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: th.primary }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: th.primary }]}>
                {uploadingAvatar
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={{ fontSize: 14 }}>📷</Text>}
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {editingName ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                    placeholder="Your name"
                    placeholderTextColor={th.sub}
                    style={[styles.input, { color: th.text, borderColor: th.border, backgroundColor: th.bg }]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={saveName}
                      disabled={savingName}
                      style={[styles.miniBtn, { backgroundColor: th.primary }]}
                    >
                      {savingName
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={styles.miniBtnText}>Save</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setEditingName(false); setDisplayName(currentName); }}
                      style={[styles.miniBtn, { backgroundColor: th.chip }]}
                    >
                      <Text style={[styles.miniBtnText, { color: th.text }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: th.text, fontSize: 20, fontFamily: FONTS.bodySemi }} numberOfLines={1}>
                      {currentName}
                    </Text>
                    <TouchableOpacity onPress={() => setEditingName(true)} hitSlop={10}>
                      <Text style={{ fontSize: 15 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: th.sub, fontSize: 13, marginTop: 4, fontFamily: FONTS.body }} numberOfLines={1}>
                    {email ?? 'Guest mode — sign in to sync'}
                  </Text>
                  {user ? (
                    <View style={[styles.badge, { backgroundColor: th.primary + '18' }]}>
                      <Text style={{ color: th.primary, fontSize: 11, fontFamily: FONTS.bodySemi }}>
                        ✓ Cloud backup on
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: th.chip }]}>
                      <Text style={{ color: th.sub, fontSize: 11, fontFamily: FONTS.bodySemi }}>
                        📱 Local only
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Stats */}
        <SectionTitle>Your journey</SectionTitle>
        <View style={styles.statsRow}>
          <StatBox icon="🔥" value={String(stats.streak)} label={t('streak', lang) ?? 'Day streak'} />
          <StatBox icon="🕌" value={String(stats.totalPrayers)} label="Prayers logged" />
          <StatBox icon="📿" value={stats.tasbihTotal > 999 ? `${(stats.tasbihTotal / 1000).toFixed(1)}k` : String(stats.tasbihTotal)} label="Tasbih count" />
          <StatBox icon="🔖" value={String(stats.bookmarks)} label="Bookmarks" />
        </View>

        {/* Account */}
        <SectionTitle>Account</SectionTitle>
        <Card style={{ padding: 4, paddingHorizontal: 14 }}>
          {user ? (
            <View>
              <RowButton
                label="Sync now"
                hint={syncing ? 'Syncing…' : `Last sync: ${lastSyncText}`}
                icon="☁️"
                onPress={doSync}
              />
              <RowButton
                label="Sign out"
                hint={email ?? ''}
                icon="🚪"
                onPress={confirmSignOut}
              />
            </View>
          ) : (
            <View style={{ paddingVertical: 6, gap: 10 }}>
              <Sub>Sign in to back up your prayers, bookmarks and settings to the cloud — free, and never required.</Sub>
              <GoldButton label={t('signIn', lang) ?? 'Login / Create account'} onPress={() => router.push('/login')} />
            </View>
          )}
        </Card>
        {!configured ? (
          <Sub style={{ marginTop: 8, fontSize: 12 }}>
            🔒 Cloud backup is not set up on this build yet — your data is safe on this device.
          </Sub>
        ) : null}

        {/* Tools */}
        <SectionTitle>Tools</SectionTitle>
        <Card>
          <View style={styles.grid}>
            {TOOLS.map(tool => (
              <TouchableOpacity
                key={tool.route}
                onPress={() => router.push(tool.route as any)}
                activeOpacity={0.75}
                style={[styles.tool, { backgroundColor: th.chip }]}
              >
                <Text style={{ fontSize: 24 }}>{tool.icon}</Text>
                <Text
                  style={{ color: th.text, fontSize: 12, fontFamily: FONTS.bodyMedium, textAlign: 'center', marginTop: 6 }}
                  numberOfLines={2}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* App */}
        <SectionTitle>App</SectionTitle>
        <Card style={{ padding: 4, paddingHorizontal: 14 }}>
          <RowButton label="Prayer Times" hint="Method & adjustments" icon="🕌" onPress={() => router.push('/settings')} />
          <RowButton label="Notifications" hint="Alerts & reminders" icon="🔔" onPress={() => router.push('/notifications')} />
          <RowButton label="About DEEN" hint="Version 1.0.5" icon="ℹ️"
            onPress={() => Alert.alert('About DEEN', 'DEEN: Prayer & Quran\nVersion 1.0.5\nPackage: com.noor.prayer\n\nCloser to Allah Every Day.')} />
        </Card>

        <View style={{ height: 24 }} />
        <React.Suspense fallback={null}>
          <AdBanner />
        </React.Suspense>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontFamily: FONTS.bodySemi },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  badge: {
    alignSelf: 'flex-start', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 16 },
  miniBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' },
  miniBtnText: { color: '#FFFFFF', fontFamily: FONTS.bodySemi, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tool: {
    flexGrow: 1, flexBasis: '45%', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
});
