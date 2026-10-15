import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen, Scroller, Card, Title, Sub, Arabic, useTheme, PillTabs } from '../components/ui';
import { WUDU_STEPS, NAMAZ_STEPS, type GuideStep } from '../data/namazGuide';
import { FONTS } from '../lib/theme';

const SECTIONS = ['wudu', 'namaz'] as const;
type Section = (typeof SECTIONS)[number];

function StepCard({ step, n, accent }: { step: GuideStep; n: number; accent: string }) {
  const th = useTheme();
  return (
    <Card>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>{n}</Text>
        </View>
        <Text style={[styles.title, { color: th.text }]}>{step.title}</Text>
      </View>
      <Sub style={styles.desc}>{step.desc}</Sub>
      {step.duaAr ? (
        <View style={[styles.duaBox, { backgroundColor: th.chip }]}>
          <Arabic size={20}>{step.duaAr}</Arabic>
          {step.duaEn ? <Sub style={styles.duaEn}>{step.duaEn}</Sub> : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function NamazGuide() {
  const th = useTheme();
  const [section, setSection] = useState<Section>('wudu');

  const steps = section === 'wudu' ? WUDU_STEPS : NAMAZ_STEPS;

  return (
    <Screen>
      <Scroller>
        <Title>🙏 Namaz Guide</Title>
        <Sub style={{ marginBottom: 12 }}>
          Learn wudu and salah step by step, per the Hanafi method.
        </Sub>
        <PillTabs
          options={SECTIONS}
          value={section}
          onChange={setSection}
          labels={{ wudu: '💧 Wudu', namaz: '🕌 Namaz' }}
        />
        <View style={{ height: 12 }} />
        {steps.map((s, i) => (
          <StepCard key={i} step={s} n={i + 1} accent={th.primary} />
        ))}
        <Sub style={{ textAlign: 'center', marginVertical: 8 }}>
          {section === 'wudu'
            ? 'Wudu breaks by natural discharges, deep sleep, or loss of senses — renew it before praying.'
            : 'This covers the essential positions of every prayer. Rakats differ by prayer — see the Prayer tab for times.'}
        </Sub>
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  badge: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bodyBold },
  title: { fontSize: 16, fontFamily: FONTS.bodySemi, flex: 1 },
  desc: { lineHeight: 22 },
  duaBox: { borderRadius: 12, padding: 12, marginTop: 10 },
  duaEn: { marginTop: 8, fontStyle: 'italic' },
});
