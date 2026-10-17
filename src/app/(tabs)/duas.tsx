import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Screen, Scroller, Card, Sub, useTheme, TopBar, SectionTitle,
  PillTabs, Arabic,
} from '../../components/ui';
import { useSettings } from '../../lib/settings';
import { t } from '../../lib/i18n';
import { DUAS, DUA_CATEGORIES, type Dua } from '../../data/duas';
import { FONTS } from '../../lib/theme';

const TAB_DAILY = 'Daily Duas';
const TAB_CATEGORY = 'By Category';
const TAB_FAV = 'Favorites';
const TABS = [TAB_DAILY, TAB_CATEGORY, TAB_FAV] as const;
type Tab = (typeof TABS)[number];

const FEATURED_ID = 'allahumma-inni-as-aluka'; // Morning Dua — "For Blessings & Guidance"
const POPULAR_IDS = [
  'rabbana-atina',
  'bismillah-alladhi',
  'subhanallah-wabihamdihi',
  'hasbunallah',
  'la-ilaha-illa-anta',
  'rabbighfirli',
];

const DHIKRS = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'];
const DHIKR_AR: Record<string, string> = {
  SubhanAllah: 'سُبْحَانَ اللَّهِ',
  Alhamdulillah: 'الْحَمْدُ لِلَّهِ',
  AllahuAkbar: 'اللَّهُ أَكْبَرُ',
};

/** Readable display title derived from the dua id (e.g. 'rabbana-atina' → 'Rabbana Atina'). */
function duaTitle(d: Dua): string {
  return d.id
    .split('-')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function byId(id: string): Dua | undefined {
  return DUAS.find(d => d.id === id);
}

function DuaRow({ dua, expanded, onToggle, isFav, onFav }: {
  dua: Dua; expanded: boolean; onToggle: () => void; isFav: boolean; onFav: () => void;
}) {
  const th = useTheme();
  const { settings } = useSettings();
  const translation = settings.translation === 'ur' ? dua.ur : settings.translation === 'hi' ? dua.hi : dua.en;
  return (
    <View style={[styles.duaWrap, { backgroundColor: th.card, borderColor: th.border }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75} style={styles.duaHead}>
        <View style={[styles.iconCircle, { backgroundColor: th.chip }]}>
          <Text style={{ fontSize: 20 }}>🤲</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodyMedium }} numberOfLines={2}>
            {duaTitle(dua)}
          </Text>
          <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body, marginTop: 2 }} numberOfLines={1}>
            {dua.ref ?? dua.category}
          </Text>
        </View>
        <TouchableOpacity onPress={onFav} hitSlop={10} activeOpacity={0.7}>
          <Text style={{ fontSize: 20, color: isFav ? '#DC2626' : th.sub }}>
            {isFav ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: th.sub, fontSize: 22, fontFamily: FONTS.body }}>
          {expanded ? '⌄' : '›'}
        </Text>
      </TouchableOpacity>
      {expanded ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          <Arabic size={22}>{dua.ar}</Arabic>
          <Text style={{ color: th.text, fontSize: 15, lineHeight: 23, fontFamily: FONTS.body }}>
            {translation}
          </Text>
          {dua.ref ? (
            <Text style={{ color: th.accent, fontSize: 12, fontFamily: FONTS.bodySemi }}>
              {dua.ref}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function TasbihCounter() {
  const th = useTheme();
  const [count, setCount] = useState(0);
  const [dhikr, setDhikr] = useState(DHIKRS[0]);
  const target = 33;

  useEffect(() => {
    AsyncStorage.getItem('tasbihCount').then(v => { if (v) setCount(Number(v) || 0); }).catch(() => {});
    AsyncStorage.getItem('tasbihDhikr').then(v => { if (v && DHIKRS.includes(v)) setDhikr(v); }).catch(() => {});
  }, []);

  const save = useCallback((c: number, d: string) => {
    setCount(c); setDhikr(d);
    AsyncStorage.setItem('tasbihCount', String(c)).catch(() => {});
    AsyncStorage.setItem('tasbihDhikr', d).catch(() => {});
  }, []);

  const tap = () => {
    const n = count + 1;
    save(n, dhikr);
    if (n % target === 0) Vibration.vibrate(40);
  };
  const nextDhikr = () => save(0, DHIKRS[(DHIKRS.indexOf(dhikr) + 1) % DHIKRS.length]);
  const reset = () => save(0, dhikr);

  const progress = Math.min(count / target, 1);
  const complete = count > 0 && count % target === 0;

  return (
    <Card style={{ alignItems: 'center', gap: 12 }}>
      <SectionTitle>Tasbih Counter</SectionTitle>
      <TouchableOpacity
        onPress={tap}
        onLongPress={nextDhikr}
        activeOpacity={0.85}
        style={[styles.countCircle, { borderColor: complete ? th.primary : th.accent }]}
      >
        <Text style={{ color: th.text, fontSize: 44, fontFamily: FONTS.bodyBold, fontVariant: ['tabular-nums'] }}>
          {count}
        </Text>
        <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body }}>
          / {target}
        </Text>
      </TouchableOpacity>
      <Text style={{ color: th.text, fontSize: 17, fontFamily: FONTS.bodySemi }}>
        {dhikr}
      </Text>
      <Text style={{ color: th.sub, fontSize: 22, textAlign: 'center' }}>
        {DHIKR_AR[dhikr.replace('Allahu Akbar', 'AllahuAkbar')] ?? ''}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: th.primary }]} />
      </View>
      {complete ? (
        <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 14 }}>
          ✓ {target} completed — {dhikr} accepted
        </Text>
      ) : (
        <Sub>Tap the circle to count · long-press for next dhikr</Sub>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={nextDhikr}
          activeOpacity={0.8}
          style={[styles.smallBtn, { borderColor: th.primary }]}
        >
          <Text style={{ color: th.primary, fontFamily: FONTS.bodySemi, fontSize: 14 }}>
            Next Dhikr →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={reset}
          activeOpacity={0.8}
          style={[styles.smallBtn, { borderColor: th.sub }]}
        >
          <Text style={{ color: th.sub, fontFamily: FONTS.bodySemi, fontSize: 14 }}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function Duas() {
  const { settings } = useSettings();
  const th = useTheme();
  const lang = settings.lang;
  const [tab, setTab] = useState<Tab>(TAB_DAILY);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('duaFavorites').then(v => {
      if (v) { try { setFavorites(JSON.parse(v) as string[]); } catch { /* keep empty */ } }
    }).catch(() => {});
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      AsyncStorage.setItem('duaFavorites', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id));
  const rowProps = (dua: Dua) => ({
    dua,
    expanded: expandedId === dua.id,
    onToggle: () => toggleExpand(dua.id),
    isFav: favorites.includes(dua.id),
    onFav: () => toggleFav(dua.id),
  });

  const featured = useMemo(() => byId(FEATURED_ID) ?? DUAS[0], []);
  const popular = useMemo(
    () => POPULAR_IDS.map(byId).filter((d): d is Dua => !!d),
    [],
  );
  const favDuas = useMemo(
    () => DUAS.filter(d => favorites.includes(d.id)),
    [favorites],
  );
  const featuredExpanded = expandedId === featured.id;
  const translation = settings.translation === 'ur' ? featured.ur : settings.translation === 'hi' ? featured.hi : featured.en;

  return (
    <Screen edges={['top']}>
      <TopBar title={t('duas', lang)} />
      <Scroller>
        <PillTabs<Tab> options={TABS} value={tab} onChange={setTab} />

        {tab === TAB_DAILY ? (
          <>
            {/* Featured dua — premium card */}
            <View style={[styles.featured, { backgroundColor: '#0B3D2E', borderColor: '#D4AF7C' }]}>
              <View style={styles.featuredTopRow}>
                <View style={styles.dayPill}>
                  <Text style={styles.dayPillText}>✨ {lang === 'hi' ? 'आज की दुआ' : lang === 'ur' ? 'آج کی دعا' : 'DUA OF THE DAY'}</Text>
                </View>
                <Text style={{ fontSize: 28 }}>🤲</Text>
              </View>
              <Text style={[styles.featuredTitle, { color: '#FFFFFF' }]}>{lang === 'hi' ? 'सुबह की दुआ' : lang === 'ur' ? 'صبح کی دعا' : 'Morning Dua'}</Text>
              <Text style={styles.featuredSubtitle}>{lang === 'hi' ? 'बरकत और हिदायत के लिए' : lang === 'ur' ? 'برکت اور ہدایت کے لیے' : 'For Blessings & Guidance'}</Text>
              <View style={styles.featuredDivider} />
              <Arabic size={18} style={styles.featuredArabic}>{featured.ar}</Arabic>
              <TouchableOpacity
                onPress={() => toggleExpand(featured.id)}
                activeOpacity={0.85}
                style={styles.readBtn}
              >
                <Text style={{ color: '#0B3D2E', fontFamily: FONTS.bodySemi, fontSize: 15 }}>
                  {featuredExpanded ? (lang === 'hi' ? 'छिपाएं ↑' : 'Hide ↑') : (lang === 'hi' ? 'पूरी दुआ पढ़ें →' : 'Read Full Dua →')}
                </Text>
              </TouchableOpacity>
              {featuredExpanded ? (
                <View style={{ gap: 10, marginTop: 6, width: '100%' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 23, fontFamily: FONTS.body }}>
                    {translation}
                  </Text>
                  {featured.ref ? (
                    <Text style={{ color: th.accent, fontSize: 12, fontFamily: FONTS.bodySemi }}>
                      {featured.ref}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => toggleFav(featured.id)}
                    activeOpacity={0.7}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Text style={{ fontSize: 22, color: favorites.includes(featured.id) ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}>
                      {favorites.includes(featured.id) ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <SectionTitle>Popular Duas</SectionTitle>
            <View style={{ gap: 10 }}>
              {popular.map(d => <DuaRow key={d.id} {...rowProps(d)} />)}
            </View>

            <TasbihCounter />
          </>
        ) : null}

        {tab === TAB_CATEGORY ? (
          <View style={{ gap: 10 }}>
            {DUA_CATEGORIES.map(cat => {
              const list = DUAS.filter(d => d.category === cat);
              const open = openCategory === cat;
              return (
                <View key={cat} style={[styles.catWrap, { backgroundColor: th.card, borderColor: th.border }]}>
                  <TouchableOpacity
                    onPress={() => setOpenCategory(open ? null : cat)}
                    activeOpacity={0.75}
                    style={styles.catHead}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: th.chip }]}>
                      <Text style={{ fontSize: 20 }}>📿</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: th.text, fontSize: 16, fontFamily: FONTS.bodyMedium }}>
                        {cat}
                      </Text>
                      <Text style={{ color: th.sub, fontSize: 13, fontFamily: FONTS.body, marginTop: 2 }}>
                        {list.length} {list.length === 1 ? 'dua' : 'duas'}
                      </Text>
                    </View>
                    <Text style={{ color: th.sub, fontSize: 22, fontFamily: FONTS.body }}>
                      {open ? '⌄' : '›'}
                    </Text>
                  </TouchableOpacity>
                  {open ? (
                    <View style={{ gap: 10, paddingHorizontal: 12, paddingBottom: 12 }}>
                      {list.map(d => <DuaRow key={d.id} {...rowProps(d)} />)}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {tab === TAB_FAV ? (
          favDuas.length ? (
            <View style={{ gap: 10 }}>
              {favDuas.map(d => <DuaRow key={d.id} {...rowProps(d)} />)}
            </View>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
              <Text style={{ fontSize: 44 }}>♡</Text>
              <Text style={{ color: th.text, fontSize: 17, fontFamily: FONTS.bodySemi }}>
                No favorites yet
              </Text>
              <Sub style={{ textAlign: 'center' }}>
                Tap the heart on any dua to save it here for quick access.
              </Sub>
            </Card>
          )
        ) : null}
      </Scroller>
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: {
    borderRadius: 20, padding: 20, alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 4,
  },
  featuredTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', marginBottom: 12,
  },
  dayPill: {
    backgroundColor: '#D4AF7C', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  dayPillText: {
    color: '#0B3D2E', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, fontFamily: FONTS.bodySemi,
  },
  featuredTitle: {
    fontSize: 24, fontWeight: '700', fontFamily: FONTS.heading,
  },
  featuredSubtitle: {
    color: '#D4AF7C', fontSize: 14, fontWeight: '600',
    fontFamily: FONTS.bodySemi, marginTop: 2,
  },
  featuredDivider: {
    height: 1, width: '40%', backgroundColor: 'rgba(212,175,124,0.4)',
    borderRadius: 1, marginVertical: 12,
  },
  featuredArabic: {
    color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 32,
  },
  readBtn: {
    backgroundColor: '#D4AF7C', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    marginTop: 14, width: '100%', alignItems: 'center',
  },
  duaWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  duaHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  catWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  countCircle: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: {
    width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(127,140,141,0.18)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  smallBtn: {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18,
  },
});
