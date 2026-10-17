// Azan audio playback via expo-audio.
//
// LICENSES:
// - assets/audio/azan.ogg is "Beautiful Adhan" by Adam-synagda,
//   released under CC0 1.0 Universal (public domain) via Wikimedia Commons.
//   Free for commercial use, no attribution required.
//   Source: https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
// - assets/audio/azan2.ogg is "Azan" by Andrewler via Wikimedia Commons
//   (freely licensed). Attribution: Adhan by Andrewler, Wikimedia Commons.
//   Source: https://commons.wikimedia.org/wiki/File:Azan.ogg

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export const AZAN_OPTIONS = [
  { id: 'azan1', name: 'Beautiful Adhan (default)', credit: 'Adam-synagda · CC0' },
  { id: 'azan2', name: 'Adhan — Andrewler', credit: 'Andrewler · Wikimedia Commons' },
  { id: 'azan3', name: 'Makkah Haram', credit: 'Seyfula Islam · CC BY 3.0' },
] as const;

export type AzanId = (typeof AZAN_OPTIONS)[number]['id'];

const azanModules: Record<AzanId, any> = {
  azan1: require('../../assets/audio/azan.mp3'),
  azan2: require('../../assets/audio/azan2.mp3'),
  azan3: require('../../assets/audio/azan_makkah.mp3'),
};

async function ensureMode() {
  if (audioReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true, // iOS: play even on silent switch
      shouldPlayInBackground: true,
    });
    audioReady = true;
  } catch {
    // audio unavailable — caller handles silence gracefully
  }
}

let player: AudioPlayer | null = null;
let audioReady = false;
let currentAzan: AzanId | null = null;

/** Play the azan sound once. Pass the azan ID (default 'azan1'). Restarts playback if called again. */
export async function playAzan(azanId: AzanId = 'azan1'): Promise<void> {
  try {
    await ensureMode();
    // Rebuild the player if the user changed the azan selection.
    if (!player || currentAzan !== azanId) {
      try { player?.remove(); } catch { /* ignore */ }
      // Use require() directly - expo-audio handles the asset
      player = createAudioPlayer(azanModules[azanId]);
      currentAzan = azanId;
    }
    player.seekTo(0);
    player.play();
  } catch (e) {
    console.log('[AzanPlayer] Error:', e);
  }
}

/** Stop azan playback if running. */
export function stopAzan(): void {
  try {
    player?.pause();
    player?.seekTo(0);
  } catch {
    // ignore
  }
}
