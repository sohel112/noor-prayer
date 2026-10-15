import React from 'react';
import { TouchableOpacity, Text, Linking, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, useTheme } from '../components/ui';
import { useSettings } from '../lib/settings';
import { t } from '../lib/i18n';
import { useLocation } from '../lib/location';

// Zero-cost: Google Maps search near the user's location (best coverage in India).
// No API key needed — opens the Google Maps app/site with a halal-restaurant query.
export default function HalalFood() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const { loc } = useLocation();

  const openGoogleMaps = () => {
    if (!loc) return;
    Linking.openURL(`https://www.google.com/maps/search/halal+restaurant/@${loc.lat},${loc.lng},14z`);
  };

  return (
    <Screen>
      <Scroller>
        <Title>🍖 {t('Halal Food Finder', lang)}</Title>
        {!loc ? (
          <Card><Sub>{t('Set your location first (Prayer tab).', lang)}</Sub></Card>
        ) : (
          <Card>
            <Sub>📍 {loc.label}</Sub>
            <Sub style={{ marginTop: 6 }}>
              {t('Find halal restaurants near you with the most complete maps data.', lang)}
            </Sub>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: th.primary, marginTop: 12 }]}
              onPress={openGoogleMaps}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>
                🗺️ {t('Search halal restaurants', lang)}
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { borderRadius: 12, padding: 14, alignItems: 'center' },
  ctaText: { fontWeight: '700', fontSize: 15 },
});
