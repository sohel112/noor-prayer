// Quran audio source — per-ayah MP3 streaming (verified working).
// Source: EveryAyah.com CDN pattern data/{Reciter}_{kbps}kbps/{SSS}{AAA}.mp3
//
// LICENSING NOTE for the app owner: recitation recordings are performances;
// their redistribution terms are unclear for commercial use. Streaming (not
// bundling) from the source site is the common practice, but VERIFY the terms
// of your chosen reciter/source before Play Store release. To switch source,
// edit RECITERS below — the player logic stays the same.

export interface Reciter { id: string; name: string; folder: string; }

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Alafasy', folder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'Mahmoud Al-Husary', folder: 'Husary_128kbps' },
];

export function ayahAudioUrl(reciter: Reciter, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciter.folder}/${s}${a}.mp3`;
}
