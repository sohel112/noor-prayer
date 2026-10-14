// UI strings — app chrome in English / Urdu / Hindi.

import type { Lang } from './settings';

const STR: Record<string, Record<Lang, string>> = {
  home: { en: 'Home', ur: 'ہوم', hi: 'होम' },
  prayer: { en: 'Prayer', ur: 'نماز', hi: 'नमाज़' },
  qibla: { en: 'Qibla', ur: 'قبلہ', hi: 'क़िबला' },
  quran: { en: 'Quran', ur: 'قرآن', hi: 'क़ुरआन' },
  more: { en: 'More', ur: 'مزید', hi: 'और' },
  nextPrayer: { en: 'Next prayer', ur: 'اگلی نماز', hi: 'अगली नमाज़' },
  in: { en: 'in', ur: 'میں', hi: 'में' },
  tasbih: { en: 'Tasbih', ur: 'تسبیح', hi: 'तस्बीह' },
  duas: { en: 'Duas', ur: 'دعائیں', hi: 'दुआएं' },
  adhkar: { en: 'Adhkar', ur: 'اذکار', hi: 'अज़कार' },
  names99: { en: '99 Names of Allah', ur: 'اسماء الحسنیٰ', hi: 'अल्लाह के 99 नाम' },
  hadith: { en: 'Hadith', ur: 'حدیث', hi: 'हदीस' },
  calendar: { en: 'Hijri Calendar', ur: 'ہجری کیلنڈر', hi: 'हिजरी कैलेंडर' },
  zakat: { en: 'Zakat Calculator', ur: 'زکوٰۃ کیلکولیٹر', hi: 'ज़कात कैलकुलेटर' },
  waris: { en: 'Inheritance Calculator', ur: 'وراثت کیلکولیٹر', hi: 'विरासत कैलकुलेटर' },
  converter: { en: 'Date Converter', ur: 'تاریخ کنورٹر', hi: 'तारीख़ कन्वर्टर' },
  mosques: { en: 'Mosque Finder', ur: 'مسجد تلاش', hi: 'मस्जिद खोजें' },
  makkahLive: { en: 'Makkah Live', ur: 'مکہ لائیو', hi: 'मक्का लाइव' },
  tracker: { en: 'Prayer Tracker', ur: 'نماز ٹریکر', hi: 'नमाज़ ट्रैकर' },
  settings: { en: 'Settings', ur: 'ترتیبات', hi: 'सेटिंग्स' },
  yourData: { en: 'Your Data', ur: 'آپ کا ڈیٹا', hi: 'आपका डेटा' },
  ayahOfDay: { en: 'Ayah of the Day', ur: 'آج کی آیت', hi: 'आज की आयत' },
  hadithOfDay: { en: 'Hadith of the Day', ur: 'آج کی حدیث', hi: 'आज की हदीस' },
  markDone: { en: 'Mark done', ur: 'مکمل نشان کریں', hi: 'पूर्ण चिह्नित करें' },
  streak: { en: 'day streak', ur: 'دن کا سلسلہ', hi: 'दिन की लड़ी' },
  tapToCount: { en: 'Tap to count', ur: 'گنے کے لیے تھپتھپائیں', hi: 'गिनने के लिए टैप करें' },
  reset: { en: 'Reset', ur: 'ری سیٹ', hi: 'रीसेट' },
  save: { en: 'Save', ur: 'محفوظ کریں', hi: 'सहेजें' },
  search: { en: 'Search', ur: 'تلاش', hi: 'खोजें' },
  bookmarks: { en: 'Bookmarks', ur: 'بک مارکس', hi: 'बुकमार्क' },
  resume: { en: 'Resume reading', ur: 'پڑھنا جاری رکھیں', hi: 'पढ़ना जारी रखें' },
  language: { en: 'Language', ur: 'زبان', hi: 'भाषा' },
  theme: { en: 'Theme', ur: 'تھیم', hi: 'थीम' },
  light: { en: 'Light', ur: 'روشن', hi: 'हल्का' },
  dark: { en: 'Dark', ur: 'تاریک', hi: 'गहरा' },
  calcMethod: { en: 'Calculation method', ur: 'حساب کا طریقہ', hi: 'गणना विधि' },
  notifications: { en: 'Notifications', ur: 'اطلاعات', hi: 'सूचनाएं' },
  quietHours: { en: 'Quiet hours', ur: 'خاموش اوقات', hi: 'शांत समय' },
  privacyNote: {
    en: 'Your data is saved on your phone first. Cloud backup is optional and only with your account. We never sell or share your data.',
    ur: 'آپ کا ڈیٹا پہلے آپ کے فون میں محفوظ ہوتا ہے۔ کلاؤڈ بیک اپ اختیاری ہے اور صرف آپ کے اکاؤنٹ سے۔ ہم آپ کا ڈیٹا کبھی بیچتے یا شیئر نہیں کرتے۔',
    hi: 'आपका डेटा पहले आपके फ़ोन में सहेजा जाता है। क्लाउड बैकअप वैकल्पिक है और केवल आपके खाते से। हम आपका डेटा कभी बेचते या साझा नहीं करते।',
  },
  fajr: { en: 'Fajr', ur: 'فجر', hi: 'फ़ज्र' },
  sunrise: { en: 'Sunrise', ur: 'طلوع آفتاب', hi: 'सूर्योदय' },
  dhuhr: { en: 'Dhuhr', ur: 'ظہر', hi: 'ज़ुहर' },
  asr: { en: 'Asr', ur: 'عصر', hi: 'अस्र' },
  maghrib: { en: 'Maghrib', ur: 'مغرب', hi: 'मग़रिब' },
  isha: { en: 'Isha', ur: 'عشاء', hi: 'इशा' },
};

export function t(key: string, lang: Lang): string {
  return STR[key]?.[lang] ?? STR[key]?.en ?? key;
}
