/**
 * In-App Review prompt logic for Deen app.
 *
 * Uses Google Play In-App Review API (via expo-store-review) to show
 * the native review dialog without leaving the app.
 *
 * Trigger conditions (user is happiest):
 *  1. 7-day prayer streak (all 5 daily prayers completed for 7 consecutive days), OR
 *  2. 5 Fajr prayers completed (consistency signal)
 *
 * The prompt shows at most once per app version. After the user interacts
 * (rates or dismisses), we never ask again for that version.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { getJSON, setJSON } from './storage';

// Uses typed storage key 'reviewPrompt' (see storage.ts)
const PRAYER_KEY_PREFIX = 'prayer_'; // matches prayer-tracker.tsx storageKey format

interface ReviewState {
  promptedVersion: string | null; // app version for which we already prompted
  dismissedForever: boolean;
}

async function getReviewState(): Promise<ReviewState> {
  try {
    const s = await getJSON<ReviewState>('reviewPrompt', {
      promptedVersion: null,
      dismissedForever: false,
    });
    return s;
  } catch {
    return { promptedVersion: null, dismissedForever: false };
  }
}

async function saveReviewState(s: ReviewState): Promise<void> {
  try {
    await setJSON('reviewPrompt', s);
  } catch {
    // best-effort
  }
}

/** Count consecutive days (ending today/yesterday) where all 5 prayers were completed. */
async function getPrayerStreakDays(): Promise<number> {
  try {
    const d = new Date();
    let streak = 0;
    // Check up to 30 days back
    for (let i = 0; i < 30; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const key = `${PRAYER_KEY_PREFIX}${check.getFullYear()}-${String(
        check.getMonth() + 1
      ).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) {
        // Allow today to be incomplete (user hasn't prayed yet today)
        if (i === 0) continue;
        break;
      }
      try {
        const done = JSON.parse(raw);
        // Expect an object/array marking 5 prayers done
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const allDone = prayers.every((p) => {
          if (Array.isArray(done)) return done.includes(p);
          return !!done[p];
        });
        if (!allDone) {
          if (i === 0) continue; // today incomplete is fine
          break;
        }
        streak++;
      } catch {
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}

/** Count total Fajr prayers completed (all time). */
async function getFajrCount(): Promise<number> {
  try {
    const d = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const key = `${PRAYER_KEY_PREFIX}${check.getFullYear()}-${String(
        check.getMonth() + 1
      ).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      try {
        const done = JSON.parse(raw);
        if (Array.isArray(done) ? done.includes('fajr') : !!done['fajr']) {
          count++;
        }
      } catch {
        // skip
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Check whether the review prompt should be shown.
 * Returns true if conditions are met AND we haven't prompted for this version.
 */
export async function shouldShowReviewPrompt(appVersion: string): Promise<boolean> {
  const state = await getReviewState();
  if (state.dismissedForever) return false;
  if (state.promptedVersion === appVersion) return false;

  const [streak, fajrCount] = await Promise.all([
    getPrayerStreakDays(),
    getFajrCount(),
  ]);

  // Condition 1: 7-day full prayer streak
  if (streak >= 7) return true;
  // Condition 2: 5 Fajr prayers completed (consistency)
  if (fajrCount >= 5) return true;

  return false;
}

/**
 * Mark the prompt as shown for this version (call after showing,
 * regardless of user action — Play API has its own quota).
 */
export async function markReviewPromptShown(appVersion: string): Promise<void> {
  const state = await getReviewState();
  state.promptedVersion = appVersion;
  await saveReviewState(state);
}

/** User tapped "Never ask again". */
export async function dismissReviewForever(): Promise<void> {
  const state = await getReviewState();
  state.dismissedForever = true;
  await saveReviewState(state);
}

/**
 * Open the native Google Play In-App Review dialog.
 * Falls back gracefully on iOS / unsupported devices.
 */
export async function openNativeReview(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
    }
  } catch {
    // Silently fail — review is optional, never crash the app
  }
}
