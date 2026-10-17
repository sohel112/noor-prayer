/**
 * ReviewPrompt — celebratory popup shown when the user hits a consistency
 * milestone (7-day prayer streak or 5 Fajr prayers).
 *
 * "MashaAllah, you are consistent! Please rate us."
 * [Rate Us] -> native Play In-App Review dialog
 * [Later]   -> dismiss (may ask again next version)
 * [Don't ask again] -> never ask
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  openNativeReview,
  markReviewPromptShown,
  dismissReviewForever,
} from '../lib/appReview';
import Constants from 'expo-constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ReviewPrompt({ visible, onClose }: Props) {
  const appVersion =
    Constants.expoConfig?.version ?? '1.0.0';

  const handleRate = async () => {
    await markReviewPromptShown(appVersion);
    onClose();
    // Small delay so the modal closes before the native dialog opens
    setTimeout(() => {
      openNativeReview();
    }, 400);
  };

  const handleLater = async () => {
    // Don't mark as shown — may prompt again later (but not this version
    // once shown; this just closes the popup for now)
    onClose();
  };

  const handleNever = async () => {
    await dismissReviewForever();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.title}>MashaAllah!</Text>
          <Text style={styles.message}>
            You are consistent with your prayers. Your streak is inspiring!
            {'\n\n'}
            Please rate Deen on the Play Store — it helps other Muslims
            discover the app.
          </Text>

          <TouchableOpacity style={styles.rateBtn} onPress={handleRate}>
            <Text style={styles.rateBtnText}>⭐ Rate Us</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLater}>
            <Text style={styles.laterText}>Maybe later</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNever}>
            <Text style={styles.neverText}>Don't ask again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F6B4F',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  rateBtn: {
    backgroundColor: '#0F6B4F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
  },
  rateBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  laterText: {
    color: '#0F6B4F',
    fontSize: 14,
    marginTop: 4,
    padding: 8,
  },
  neverText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
    padding: 8,
  },
});
