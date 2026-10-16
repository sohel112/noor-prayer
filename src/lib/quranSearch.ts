// Deen — Full-Text Quran Search
// Searches verse text (English translation + Arabic) across the entire Quran.
// Zero APK impact — uses existing bundled Quran data.

import quranEn from '../data/quran-en.json';
import quranAr from '../data/quran-ar.json';
import surahs from '../data/surahs.json';

export interface SearchResult {
  surah: number;
  ayah: number;
  surahName: string;
  textEn: string;
  textAr: string;
}

interface SurahMeta {
  n: number;
  en: string;
  ar: string;
}

const SURAHS = surahs as SurahMeta[];
const EN = quranEn as Record<string, string[]>;
const AR = quranAr as Record<string, string[]>;

function surahName(n: number): string {
  return SURAHS.find(s => s.n === n)?.en || `Surah ${n}`;
}

/**
 * Search verse text. Returns up to `limit` matches.
 * Matches against English translation and Arabic text.
 */
export function searchQuran(query: string, limit = 50): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];
  const isArabic = /[\u0600-\u06FF]/.test(query);

  for (const surahKey of Object.keys(EN)) {
    const surahNum = parseInt(surahKey, 10);
    const versesEn = EN[surahKey] || [];
    const versesAr = AR[surahKey] || [];

    for (let i = 0; i < versesEn.length; i++) {
      const en = versesEn[i] || '';
      const ar = versesAr[i] || '';
      const haystack = isArabic ? ar : en.toLowerCase();

      if (haystack.includes(q)) {
        results.push({
          surah: surahNum,
          ayah: i + 1,
          surahName: surahName(surahNum),
          textEn: en,
          textAr: ar,
        });
        if (results.length >= limit) return results;
      }
    }
    if (results.length >= limit) break;
  }

  return results;
}

/** Count total verses (for stats). */
export function totalVerses(): number {
  return Object.values(EN).reduce((sum, v) => sum + v.length, 0);
}
