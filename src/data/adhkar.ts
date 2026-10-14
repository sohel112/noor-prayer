// Morning & Evening Adhkar — the daily remembrance routine.
// Each item: Arabic, English meaning, recommended count.

export interface Dhikr { id: string; ar: string; en: string; count: number; ref?: string; }

export const MORNING_ADHKAR: Dhikr[] = [
  { id: 'm-ayatulkursi', ar: 'آية الكرسي — اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', en: 'Ayat al-Kursi (Quran 2:255) — whoever recites it in the morning is protected till evening.', count: 1, ref: 'Quran 2:255' },
  { id: 'm-ikhlas', ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ... (سورۃ الإخلاص، الفلق، الناس)', en: 'Surah Al-Ikhlas, Al-Falaq, An-Nas — 3 times each morning and evening suffices against everything.', count: 3, ref: 'Abu Dawud, Tirmidhi' },
  { id: 'm-bismillah', ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ...', en: 'In the name of Allah... nothing can harm — 3x.', count: 3 },
  { id: 'm-raditu', ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا', en: 'I am pleased with Allah as Lord, Islam as religion, Muhammad ﷺ as Prophet — 3x.', count: 3, ref: 'Abu Dawud' },
  { id: 'm-subhan100', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', en: 'Glory be to Allah and praise Him — 100x.', count: 100 },
  { id: 'm-lailaha100', ar: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', en: 'None worthy of worship but Allah alone... — 100x (or 10x).', count: 100, ref: 'Bukhari, Muslim' },
  { id: 'm-istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', en: 'I seek Allah’s forgiveness and repent to Him — 100x daily.', count: 100, ref: 'Muslim' },
];

export const EVENING_ADHKAR: Dhikr[] = [
  { id: 'e-ayatulkursi', ar: 'آية الكرسي — اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', en: 'Ayat al-Kursi — protection till morning.', count: 1, ref: 'Quran 2:255' },
  { id: 'e-ikhlas', ar: 'سورۃ الإخلاص، الفلق، الناس', en: 'Last three surahs — 3x each.', count: 3 },
  { id: 'e-audhu', ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', en: 'I seek refuge in the perfect words of Allah — 3x.', count: 3, ref: 'Muslim' },
  { id: 'e-amsayna', ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ', en: 'We have reached the evening and dominion belongs to Allah; praise be to Allah.', count: 1, ref: 'Muslim' },
  { id: 'e-subhan100', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', en: 'Glory be to Allah and praise Him — 100x.', count: 100 },
];

// After-prayer (post-salah) dhikr presets
export const AFTER_PRAYER_DHIKR: Dhikr[] = [
  { id: 'p-astaghfir', ar: 'أَسْتَغْفِرُ اللَّهَ', en: 'I seek Allah’s forgiveness', count: 3, ref: 'Muslim' },
  { id: 'p-allahumma-antas-salam', ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', en: 'O Allah, You are Peace and from You comes peace...', count: 1, ref: 'Muslim' },
  { id: 'p-subhan33', ar: 'سُبْحَانَ اللَّهِ', en: 'Glory be to Allah', count: 33 },
  { id: 'p-alhamd33', ar: 'الْحَمْدُ لِلَّهِ', en: 'Praise be to Allah', count: 33 },
  { id: 'p-allahu33', ar: 'اللَّهُ أَكْبَرُ', en: 'Allah is Greatest', count: 34, ref: 'Muslim (33+33+34)' },
  { id: 'p-ayatulkursi', ar: 'آية الكرسي', en: 'Ayat al-Kursi — nothing stands between him and Paradise but death.', count: 1, ref: 'Nasa’i' },
];
