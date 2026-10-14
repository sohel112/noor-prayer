import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useSettings } from '../../lib/settings';
import { DARK, LIGHT } from '../../lib/theme';
import { t } from '../../lib/i18n';

const ICONS: Record<string, string> = {
  index: '◐',
  prayer: '🕌',
  qibla: '🧭',
  quran: '📖',
  more: '☰',
};

function TabIcon({ route, color }: { route: string; color: ColorValue }) {
  return <Text style={{ fontSize: 22, color }}>{ICONS[route] ?? '•'}</Text>;
}

export default function TabsLayout() {
  const { settings } = useSettings();
  const theme = settings.theme === 'dark' ? DARK : LIGHT;
  const lang = settings.lang;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.sub,
        tabBarIcon: ({ color }) => <TabIcon route={route.name} color={color} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home', lang) }} />
      <Tabs.Screen name="prayer" options={{ title: t('prayer', lang) }} />
      <Tabs.Screen name="qibla" options={{ title: t('qibla', lang) }} />
      <Tabs.Screen name="quran" options={{ title: t('quran', lang) }} />
      <Tabs.Screen name="more" options={{ title: t('more', lang) }} />
    </Tabs>
  );
}
