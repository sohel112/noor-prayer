import React from 'react';
import { Screen, Scroller, Title, RowButton } from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { router } from 'expo-router';

export default function More() {
  const { settings } = useSettings();
  const lang = settings.lang;

  const items = [
    { label: t('duas', lang), hint: 'Essential supplications', icon: '🤲', route: '/duas' },
    { label: t('adhkar', lang), hint: 'Morning & evening remembrance', icon: '🌅', route: '/adhkar' },
    { label: t('names99', lang), hint: 'Asma ul Husna', icon: '✨', route: '/names' },
    { label: t('hadith', lang), hint: 'Daily hadith collection', icon: '📜', route: '/hadith' },
    { label: t('calendar', lang), hint: 'Hijri dates & occasions', icon: '📅', route: '/calendar' },
    { label: t('tracker', lang), hint: 'Daily prayers + Qada', icon: '✅', route: '/tracker' },
    { label: t('zakat', lang), hint: '', icon: '💰', route: '/zakat' },
    { label: t('waris', lang), hint: '', icon: '⚖️', route: '/waris' },
    { label: t('converter', lang), hint: 'Hijri ↔ Gregorian', icon: '🔄', route: '/converter' },
    { label: t('mosques', lang), hint: 'Nearby via OpenStreetMap', icon: '🕌', route: '/mosques' },
    { label: t('makkahLive', lang), hint: 'Live stream', icon: '🕋', route: '/makkah' },
    { label: 'Quran Audio', hint: 'Recitation streaming', icon: '🔊', route: '/audio' },
    { label: t('tasbih', lang), hint: 'Dhikr counter', icon: '📿', route: '/tasbih' },
    { label: t('yourData', lang), hint: 'Backup, export, privacy', icon: '🔒', route: '/yourdata' },
    { label: t('settings', lang), hint: '', icon: '⚙️', route: '/settings' },
  ];

  return (
    <Screen>
      <Scroller>
        <Title>{t('more', lang)}</Title>
        {items.map(i => (
          <RowButton
            key={i.route}
            label={`${i.icon}  ${i.label}`}
            hint={i.hint}
            onPress={() => router.push(i.route as any)}
          />
        ))}
      </Scroller>
    </Screen>
  );
}
