// More / Profile tab — hub for everything outside the 4 main tabs:
// profile header, settings rows (with expandable Appearance), tools grid, account.
import React, { useEffect, useState } from 'react';
import {
  Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Screen, Scroller, Card, useTheme, Title, Sub, SectionTitle,
  RowButton, PrimaryButton,
} from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { useAuth } from '../../lib/auth';
import { getJSON, setJSON } from '../../lib/storage';
import { FONTS } from '../../lib/theme';
import { t } from '../../lib/i18n';

type FontSize = 'small' | 'medium' | 'large';

interface Tool { label: string; icon: string; route: string }

// Every route below verified to exist in src/app/ (route groups are stripped from URLs,
// so '/qibla' resolves the (tabs)/qibla.tsx screen).
const TOOLS: Tool[] = [
  { label: 'Makkah Live', icon: '🕋', route: '/makkah' },
  { label: 'Mosque Finder', icon: '🕌', route: '/mosques' },
  { label: 'Zakat Calculator', icon: '💰', route: '/zakat' },
  { label: '99 Names', icon: '✨', route: '/names' },
  { label: 'Hadith', icon: '📜', route: '/hadith' },
  { label: 'Tasbih', icon: '📿', route: '/tasbih' },
  { label: 'Ramadan', icon: '🌙', route: '/ramadan' },
  { label: 'Qibla', icon: '🧭', route: '/qibla' },
  { label: 'Waris Calculator', icon: '⚖️', route: '/waris' },
  { label: 'Hijri Converter', icon: '🔄', route: '/converter' },
  { label: 'Adhkar', icon: '🌅', route: '/adhkar' },
  { label: 'Fajr Alarm', icon: '⏰', route: '/fajr-alarm' },
  { label: 'Battery Guide', icon: '🔋', route: '/battery' },
  { label: 'Khatm Tracker', icon: '📖', route: '/khatm-tracker' },
  { label: 'Islamic Events', icon: '📅', route: '/islamic-events' },
  { label: 'Sadaqah Tracker', icon: '💰', route: '/sadaqah-tracker' },
  { label: 'Tahajjud Tracker', icon: '🌙', route: '/tahajjud-tracker' },
  { label: 'Masjid Visits', icon: '🕌', route: '/masjid-visits' },
  { label: "I'tikaf Tracker", icon: '🕋', route: '/itikaf-tracker' },
];

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
];

function AppearanceSection() {
  const th = useTheme();
  const { settings, update } = useSettings();
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  useEffect(() => {
    getJSON<FontSize>('fontSize', 'medium').then(v => {
      if (v === 'small' || v === 'medium' || v === 'large') setFontSize(v);
    });
  }, []);

  const setSize = (v: FontSize) => {
    setFontSize(v);
    setJSON('fontSize', v);
  };

  const themeCard = (mode: 'light' | 'dark', label: string, icon: string) => {
    const active = settings.theme === mode;
    return (
      <TouchableOpacity
        key={mode}
        onPress={() => update({ theme: mode })}
        activeOpacity={0.8}
        style={[
          styles.themeCard,
          { backgroundColor: th.chip, borderColor: active ? th.primary : th.border },
        ]}
      >
        <Text style={{ fontSize: 26 }}>{icon}</Text>
        <Text style={{ color: th.text, fontFamily: FONTS.bodySemi, fontSize: 14, marginTop: 8 }}>
          {label}
        </Text>
        <View style={[
          styles.check,
          { borderColor: active ? th.primary : th.border, backgroundColor: active ? th.primary : 'transparent' },
        ]}>
          {active ? <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 4, gap: 14 }}>
      <View>
        <Sub style={{ marginBottom: 8 }}>Theme</Sub>
        <View style={styles.themeRow}>
          {themeCard('light', 'Light', '☀️')}
          {themeCard('dark', 'Dark', '🌙')}
        </View>
      </View>
      <View>
        <Sub style={{ marginBottom: 8 }}>Font size</Sub>
        <View style={[styles.sizeRow, { backgroundColor: th.chip }]}>
          {FONT_SIZES.map(f => {
            const active = fontSize === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setSize(f.key)}
                activeOpacity={0.8}
                style={[styles.sizeBtn, active && { backgroundColor: th.primary }]}
              >
                <Text style={{
                  color: active ? '#FFFFFF' : th.sub,
                  fontFamily: FONTS.bodySemi, fontSize: 13,
                }}>
                  {f.label}{active ? ' ✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Sub style={{ marginTop: 8, fontSize: 12 }}>
          Your preference is saved on this device.
        </Sub>
      </View>
    </View>
  );
}

export default function More() {
  const th = useTheme();
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const lang = settings.lang;
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const displayName = (typeof meta?.full_name === 'string' && meta.full_name)
    || user?.email?.split('@')[0]
    || 'Guest User';
  const email = user?.email ?? 'Sign in to sync your data';
  const initial = displayName === 'Guest User' ? '👤' : displayName.charAt(0).toUpperCase();

  const go = (route: string) => router.push(route as any);

  const helpAlert = () => Alert.alert(
    'Help & Support',
    'Need help with DEEN?\n\n• Check the Battery Guide so prayer alerts are never missed\n• Prayer times can be adjusted in Settings → Prayer Times\n\nFor feedback or bugs, reach us through the Play Store listing page.',
  );

  const aboutAlert = () => Alert.alert(
    'About DEEN',
    'DEEN: Prayer & Quran\nVersion 1.0.5\nPackage: com.noor.prayer\n\nCloser to Allah Every Day.',
  );

  return (
    <Screen edges={['top']}>
      <Scroller>
        <Title>{t('more', lang)}</Title>

        {/* Profile header — tap to open full profile */}
        <TouchableOpacity onPress={() => go('/profile')} activeOpacity={0.85}>
          <Card>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: th.primary }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 18, fontFamily: FONTS.bodySemi }} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={{ color: th.sub, fontSize: 13, marginTop: 4, fontFamily: FONTS.body }} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <Text style={{ color: th.sub, fontSize: 20 }}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Settings */}
        <View>
          <SectionTitle>Settings</SectionTitle>
          <Card style={{ padding: 4, paddingHorizontal: 14 }}>
            <RowButton label="Prayer Times" hint="Method, adjustments & azan" icon="🕌" onPress={() => go('/settings')} />
            <RowButton label={t('quran', lang)} hint="Read & translations" icon="📖" onPress={() => go('/(tabs)/quran')} />
            <TouchableOpacity
              onPress={() => setAppearanceOpen(o => !o)}
              activeOpacity={0.7}
              style={[styles.rowBtn, { borderBottomColor: th.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: th.chip }]}>
                <Text style={{ fontSize: 18 }}>🎨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodyMedium }}>Appearance</Text>
                <Text style={{ color: th.sub, fontSize: 13, marginTop: 2, fontFamily: FONTS.body }}>
                  Theme & font size
                </Text>
              </View>
              <Text style={{ color: th.sub, fontSize: 22, fontFamily: FONTS.body }}>
                {appearanceOpen ? '⌄' : '›'}
              </Text>
            </TouchableOpacity>
            {appearanceOpen ? <AppearanceSection /> : null}
            <RowButton label={t('language', lang)} hint="App language" icon="🌐" onPress={() => go('/settings')} />
            <RowButton label="Help & Support" icon="💬" onPress={helpAlert} />
            <RowButton label="About DEEN" hint="Version 1.0.5" icon="ℹ️" onPress={aboutAlert} />
          </Card>
        </View>

        {/* Tools grid */}
        <View>
          <SectionTitle>Tools</SectionTitle>
          <Card>
            <View style={styles.grid}>
              {TOOLS.map(tool => (
                <TouchableOpacity
                  key={tool.route}
                  onPress={() => go(tool.route)}
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
        </View>

        {/* Account */}
        <Card>
          {user ? (
            <View style={{ gap: 10 }}>
              <Sub>Signed in as {user.email}</Sub>
              <PrimaryButton
                label="Sign out"
                icon="🚪"
                onPress={() => signOut()}
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Sub>Sign in to back up your data to the cloud and sync across devices.</Sub>
              <PrimaryButton
                label="Login / Create account"
                icon="👤"
                onPress={() => go('/login')}
              />
            </View>
          )}
        </Card>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontFamily: FONTS.bodySemi },
  rowBtn: {
    borderBottomWidth: 1,
    paddingVertical: 14, paddingHorizontal: 4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  rowIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeCard: {
    flex: 1, borderRadius: 14, borderWidth: 2,
    paddingVertical: 16, alignItems: 'center',
  },
  check: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  sizeRow: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  sizeBtn: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tool: {
    width: '48%', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
});
