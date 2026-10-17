// Deen — Referral Leaderboard
// Overall + district-wise rankings.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, useTheme, Card } from '../components/ui';
import { FONTS } from '../lib/theme';
import { useSettings } from '../lib/settings';
import { getSupabase } from '../lib/supabase';
import { getLeaderboard, detectDistrict, getMyReferralCode, getMyReferralCount, shareApp, type LeaderboardEntry } from '../lib/referral';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const th = useTheme();
  const { settings } = useSettings();
  const lang = settings.lang;
  const [tab, setTab] = useState<'overall' | 'district'>('overall');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [myCount, setMyCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) { setLoading(false); return; }
      const { data: { user } } = await sb.auth.getUser();
      setLoggedIn(!!user);
      if (user) {
        setMyCode(await getMyReferralCode());
        setMyCount(await getMyReferralCount());
      }
      const d = await detectDistrict();
      setDistrict(d);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await getLeaderboard(tab === 'district' ? district : null);
      setEntries(list);
      setLoading(false);
    })();
  }, [tab, district]);

  const onShare = async () => {
    const result = await shareApp(lang, true);
    if (result === 'login_required') {
      Alert.alert(
        lang === 'hi' ? 'लॉगिन आवश्यक' : lang === 'ur' ? 'لاگ ان ضروری' : 'Login Required',
        lang === 'hi' ? 'रेफरल कमाने के लिए लॉगिन करें! आपका रेफरल काउंट लॉगिन के बाद ही बढ़ेगा। 🤲' : lang === 'ur' ? 'ریفرل کمانے کے لیے لاگ ان کریں! آپ کا ریفرل کاؤنٹ لاگ ان کے بعد ہی بڑھے گا۔ 🤲' : 'Please login to earn referrals! Your referral count will only increase after login. 🤲',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/profile') },
        ]
      );
    }
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.row, { backgroundColor: th.card, borderColor: th.border }]}>
      <Text style={styles.medal}>{item.rank <= 3 ? MEDALS[item.rank - 1] : `#${item.rank}`}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.code, { color: th.text }]}>{item.referral_code || 'Anonymous'}</Text>
        {item.district ? <Text style={[styles.district, { color: th.sub }]}>📍 {item.district}</Text> : null}
      </View>
      <View style={[styles.countBadge, { backgroundColor: th.primary }]}>
        <Text style={styles.countText}>{item.referral_count}</Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <TopBar title="🏆 Leaderboard" onBack={() => router.back()} />
      <View style={styles.container}>
        <Card style={[styles.myCard, { backgroundColor: th.primary }]}>
          <Text style={styles.myCardTitle}>My Referrals</Text>
          <Text style={styles.myCardCount}>{myCount}</Text>
          {myCode ? (
            <Text style={styles.myCardCode}>Your code: {myCode}</Text>
          ) : (
            <Text style={styles.myCardCode}>{loggedIn ? 'Loading...' : 'Login to get your code!'}</Text>
          )}
          <TouchableOpacity onPress={onShare} style={[styles.shareBtn, { backgroundColor: th.accent }]}>
            <Text style={[styles.shareBtnText, { color: '#0B3D2E' }]}>📤 Share & Earn Sawab</Text>
          </TouchableOpacity>
        </Card>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setTab('overall')} style={[styles.tab, tab === 'overall' && { backgroundColor: th.primary }]}>
            <Text style={[styles.tabText, { color: tab === 'overall' ? '#FFF' : th.text }]}>🌍 Overall</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('district')} style={[styles.tab, tab === 'district' && { backgroundColor: th.primary }]}>
            <Text style={[styles.tabText, { color: tab === 'district' ? '#FFF' : th.text }]}>📍 {district ?? 'My District'}</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={th.primary} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <Text style={[styles.empty, { color: th.sub }]}>No referrals yet. Be the first! 🚀</Text>
        ) : (
          <FlatList data={entries} renderItem={renderEntry} keyExtractor={(item) => item.user_id} contentContainerStyle={{ gap: 8, paddingBottom: 20 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  myCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  myCardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: FONTS.body },
  myCardCount: { color: '#FFF', fontSize: 48, fontWeight: '700', fontFamily: FONTS.body },
  myCardCode: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: FONTS.bodySemi, marginTop: 4 },
  shareBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  shareBtnText: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.body },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.body },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
  medal: { fontSize: 24, minWidth: 44, textAlign: 'center' },
  code: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.body },
  district: { fontSize: 12, fontFamily: FONTS.body, marginTop: 2 },
  countBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15, fontFamily: FONTS.body },
});
