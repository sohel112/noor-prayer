// Ramadan Hub logic — duas data, 30-day fast/taraweeh tracker storage,
// and Ramadan date helpers. Everything runs on-device; no network.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { toHijri, type HijriDate } from './hijri';

/** Storage key (kept local to this module — no existing files touched). */
const KEY = 'noor.ramadan.v1';

export interface RamadanDay {
  /** true = fast kept that day */
  fast?: boolean;
  /** true = taraweeh prayed that night */
  taraweeh?: boolean;
}

/** day 1..30 -> record */
export type RamadanYear = Record<number, RamadanDay>;
/** hijriYear (e.g. "1447") -> days */
export type RamadanStore = Record<string, RamadanYear>;

export async function loadRamadan(): Promise<RamadanStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RamadanStore) : {};
  } catch {
    return {};
  }
}

export async function saveRamadan(store: RamadanStore): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage unavailable — tracker keeps working in-memory for the session
  }
}

export interface RamadanNow {
  hijri: HijriDate;
  isRamadan: boolean;
  /** 1..30 while in Ramadan, else null */
  ramadanDay: number | null;
  isLastTen: boolean;
  hijriYear: number;
}

/** Current Ramadan status from the on-device Hijri calendar. */
export function ramadanNow(d = new Date(), hijriAdjust = 0): RamadanNow {
  const hijri = toHijri(d, hijriAdjust);
  const isRamadan = hijri.month === 9;
  return {
    hijri,
    isRamadan,
    ramadanDay: isRamadan ? hijri.day : null,
    isLastTen: isRamadan && hijri.day >= 21,
    hijriYear: hijri.year,
  };
}

/** Odd nights of the last 10 — Laylatul Qadr is sought on these. */
export const ODD_NIGHTS = [21, 23, 25, 27, 29];

export interface RamadanDua {
  id: string;
  title: string;
  ar: string;
  en: string;
  ur: string;
}

/**
 * Well-known Ramadan duas (standard hadith texts, public domain).
 * Keep Arabic exactly; translations are plain-language summaries.
 */
export const RAMADAN_DUAS: RamadanDua[] = [
  {
    id: 'moon',
    title: 'Moon-sighting dua',
    ar: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالإِيمَانِ وَالسَّلاَمَةِ وَالإِسْلاَمِ، رَبِّي وَرَبُّكَ اللَّهُ',
    en: 'O Allah, let this moon appear to us with blessing and faith, safety and Islam. My Lord and your Lord is Allah.',
    ur: 'اے اللہ! اس چاند کو ہمارے لیے برکت اور ایمان، سلامتی اور اسلام کے ساتھ طلوع فرما۔ میرا اور تمہارا رب اللہ ہے۔',
  },
  {
    id: 'sehri',
    title: 'Sehri intention',
    ar: 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
    en: 'I intend to fast tomorrow in the month of Ramadan.',
    ur: 'میں نے ماہِ رمضان کے کل کے روزے کی نیت کی۔',
  },
  {
    id: 'iftar1',
    title: "Dua at iftar",
    ar: 'اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    en: 'O Allah, I fasted for You, I believe in You, I put my trust in You, and I break my fast with Your provision.',
    ur: 'اے اللہ! میں نے تیرے لیے روزہ رکھا، تجھ پر ایمان لایا، تجھ پر بھروسہ کیا اور تیرے رزق سے افطار کیا۔',
  },
  {
    id: 'iftar2',
    title: 'After breaking fast',
    ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
    en: 'Thirst is gone, the veins are moistened, and the reward is assured, if Allah wills.',
    ur: 'پیاس بجھ گئی، رگیں تر ہو گئیں اور اجر ثابت ہو گیا، ان شاء اللہ۔',
  },
  {
    id: 'qadr',
    title: 'Laylatul Qadr dua',
    ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    en: 'O Allah, You are Forgiving and love forgiveness, so forgive me.',
    ur: 'اے اللہ! تو معاف کرنے والا ہے، معافی کو پسند کرتا ہے، پس مجھے معاف فرما۔',
  },
];
