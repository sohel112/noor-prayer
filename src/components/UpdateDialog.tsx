/**
 * UpdateDialog — shows when a newer app version is available.
 * Optional update: user can dismiss. Force update: must update to continue.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, Linking } from 'react-native';
import { PrimaryButton, useTheme } from './ui';
import type { UpdateInfo } from '../lib/updateCheck';

export function UpdateDialog({
  info,
  onClose,
}: {
  info: UpdateInfo;
  onClose: () => void;
}) {
  const t = useTheme();

  const openUpdate = () => {
    Linking.openURL(info.updateUrl).catch(() => {});
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.icon]}>🎉</Text>
          <Text style={[styles.title, { color: t.text }]}>
            {info.force ? 'Update Required' : 'New Update Available'}
          </Text>
          <Text style={[styles.sub, { color: t.sub }]}>
            Version {info.latestVersion} is out
            {info.changelog ? ` — ${info.changelog}` : ''}. You're on{' '}
            {info.currentVersion}.
          </Text>
          <PrimaryButton label="Update Now" onPress={openUpdate} icon="⬇️" />
          {!info.force && (
            <Text style={[styles.later, { color: t.sub }]} onPress={onClose}>
              Later
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    borderRadius: 20,
    padding: 26,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  later: { fontSize: 14, marginTop: 4, textDecorationLine: 'underline' },
});
