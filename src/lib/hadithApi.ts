/**
 * Online Hadith fetching — zero APK size increase.
 * Uses the free api.hadith.gading.dev (no API key needed).
 * Falls back gracefully to bundled hadiths when offline.
 */

export interface OnlineHadith {
  id: string;
  ar: string;
  en: string; // Indonesian translation mapped to English field
  ref: string;
  topic: string;
}

const BASE = 'https://api.hadith.gading.dev';

export const HADITH_BOOKS = [
  { id: 'bukhari', name: 'Sahih Bukhari', total: 7563 },
  { id: 'muslim', name: 'Sahih Muslim', total: 5362 },
  { id: 'abu-daud', name: 'Sunan Abu Daud', total: 4419 },
  { id: 'tirmidzi', name: 'Jami at-Tirmidzi', total: 3891 },
  { id: 'nasai', name: 'Sunan an-Nasai', total: 5364 },
  { id: 'ibnu-majah', name: 'Sunan Ibnu Majah', total: 4285 },
  { id: 'ahmad', name: 'Musnad Ahmad', total: 4305 },
  { id: 'darimi', name: 'Sunan Darimi', total: 2949 },
  { id: 'malik', name: 'Muwatta Malik', total: 1594 },
] as const;

export type HadithBookId = (typeof HADITH_BOOKS)[number]['id'];

interface ApiHadith {
  number: number;
  arab: string;
  id: string; // Indonesian translation
}

function toOnlineHadith(bookName: string, h: ApiHadith): OnlineHadith {
  return {
    id: `${bookName}-${h.number}`,
    ar: h.arab,
    en: h.id,
    ref: `${bookName} #${h.number}`,
    topic: bookName,
  };
}

/** Fetch a single hadith by book + number. */
export async function fetchHadith(book: HadithBookId, number: number): Promise<OnlineHadith | null> {
  try {
    const res = await fetch(`${BASE}/books/${book}/${number}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const h: ApiHadith | undefined = json?.data?.hadiths?.[0] ?? json?.data;
    if (!h?.arab) return null;
    const bookName = HADITH_BOOKS.find(b => b.id === book)?.name ?? book;
    return toOnlineHadith(bookName, h);
  } catch {
    return null;
  }
}

/** Fetch a random hadith from a random book. */
export async function fetchRandomHadith(): Promise<OnlineHadith | null> {
  const book = HADITH_BOOKS[Math.floor(Math.random() * HADITH_BOOKS.length)];
  const num = 1 + Math.floor(Math.random() * Math.min(book.total, 5000));
  return fetchHadith(book.id, num);
}

/** Fetch a range of hadiths from a book (for browsing). */
export async function fetchHadithRange(
  book: HadithBookId, from: number, to: number
): Promise<OnlineHadith[]> {
  try {
    const res = await fetch(`${BASE}/books/${book}?range=${from}-${to}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list: ApiHadith[] = json?.data?.hadiths ?? [];
    const bookName = HADITH_BOOKS.find(b => b.id === book)?.name ?? book;
    return list.filter(h => h?.arab).map(h => toOnlineHadith(bookName, h));
  } catch {
    return [];
  }
}
