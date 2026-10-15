import React, { memo } from 'react';
import { Tabs } from 'expo-router';
import { Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../lib/settings';
import { DARK, LIGHT, FONTS } from '../../lib/theme';
import { t } from '../../lib/i18n';

const ICONS: Record<string, string> = {
  index: '⌂',
  quran: '📖',
  duas: '🤲',
  calendar: '📅',
  profile: '👤',
};

const TabIcon = memo(function TabIcon({ route, color, focused }: {
  route: string; color: ColorValue; focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      {focused ? (
        <View style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: color as string, marginBottom: 4 }} />
      ) : (
        <View style={{ height: 7 }} />
      )}
      <Text style={{ fontSize: 21, color }}>{ICONS[route] ?? '•'}</Text>
    </View>
  );
});

export default function TabsLayout() {
  const { settings } = useSettings();
  const theme = settings.theme === 'dark' ? DARK : LIGHT;
  const lang = settings.lang;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        // Prevents unmounting tabs on switch → avoids re-render lag
        freezeOnBlur: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.sub,
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONTS.bodySemi, marginTop: 2 },
        tabBarIcon: ({ color, focused }) => <TabIcon route={route.name} color={color} focused={focused} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home', lang) }} />
      <Tabs.Screen name="quran" options={{ title: t('quran', lang) }} />
      <Tabs.Screen name="duas" options={{ title: t('duas', lang) }} />
      <Tabs.Screen name="calendar" options={{ title: t('calendar', lang) }} />
      <Tabs.Screen name="profile" options={{ title: t('profile', lang) ?? 'Profile' }} />
      {/* Hidden from tab bar — opened via router.push */}
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="qibla" options={{ href: null }} />
    </Tabs>
  );
}
