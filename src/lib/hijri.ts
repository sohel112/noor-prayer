// Hijri (Islamic) calendar — arithmetic (Kuwaiti algorithm) implementation.
// Runs fully on-device. Includes optional manual moon-sighting adjustment (±days).

export interface HijriDate { year: number; month: number; day: number; }

const MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah',
];

const MONTHS_UR = [
  'محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی',
  'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ',
];

function gregorianToJd(y: number, m: number, d: number): number {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524;
}

export function toHijri(date: Date, adjustmentDays = 0): HijriDate {
  const jd = gregorianToJd(date.getFullYear(), date.getMonth() + 1, date.getDate()) + adjustmentDays;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719)
    + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

export function hijriMonthName(month: number, lang: 'en' | 'ur' | 'hi' = 'en'): string {
  if (lang === 'ur') return MONTHS_UR[month - 1] ?? '';
  return MONTHS[month - 1] ?? '';
}

export function formatHijri(h: HijriDate, lang: 'en' | 'ur' | 'hi' = 'en'): string {
  return `${h.day} ${hijriMonthName(h.month, lang)} ${h.year}H`;
}

/** Well-known Hijri occasions for alerts. month is 1-based. */
export interface HijriOccasion { month: number; day: number; nameEn: string; nameUr: string; }
export const HIJRI_OCCASIONS: HijriOccasion[] = [
  { month: 1, day: 1, nameEn: 'Islamic New Year', nameUr: 'نیا اسلامی سال' },
  { month: 1, day: 10, nameEn: 'Ashura', nameUr: 'عاشورہ' },
  { month: 3, day: 12, nameEn: "Mawlid an-Nabi", nameUr: 'عید میلاد النبی' },
  { month: 7, day: 27, nameEn: "Laylat al-Mi'raj", nameUr: 'معراج النبی' },
  { month: 8, day: 15, nameEn: "Laylat al-Bara'ah", nameUr: 'شب برات' },
  { month: 9, day: 1, nameEn: 'Ramadan begins', nameUr: 'رمضان المبارک' },
  { month: 9, day: 27, nameEn: 'Laylatul Qadr (observed)', nameUr: 'شب قدر' },
  { month: 10, day: 1, nameEn: 'Eid al-Fitr', nameUr: 'عید الفطر' },
  { month: 12, day: 10, nameEn: 'Eid al-Adha', nameUr: 'عید الاضحی' },
  { month: 12, day: 9, nameEn: 'Day of Arafah', nameUr: 'یوم عرفہ' },
];
