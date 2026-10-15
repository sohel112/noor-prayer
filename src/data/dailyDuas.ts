// 30 short daily duas — cycled by day-of-year for the Dua of the Day notification.
// Sources: Quran and authentic hadith collections.

export interface DailyDua { ar: string; en: string; ref: string; }

export const DAILY_DUAS: DailyDua[] = [
  { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', en: 'Our Lord, give us good in this world and good in the Hereafter, and shield us from the punishment of the Fire.', ref: "Quran 2:201" },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', en: 'O Allah, I ask You for well-being.', ref: 'Tirmidhi' },
  { ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', en: 'My Lord, expand for me my chest and ease for me my task.', ref: 'Quran 20:25-26' },
  { ar: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', en: 'O Allah, help me to remember You, thank You, and worship You in the best manner.', ref: 'Abu Dawud' },
  { ar: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', en: 'Our Lord, do not let our hearts deviate after You have guided us.', ref: 'Quran 3:8' },
  { ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', en: 'O Allah, I seek refuge in You from anxiety and grief.', ref: 'Bukhari' },
  { ar: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', en: 'O Turner of hearts, make my heart firm upon Your religion.', ref: 'Tirmidhi' },
  { ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', en: 'O Allah, You are Pardoning and love pardon, so pardon me.', ref: 'Tirmidhi' },
  { ar: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', en: 'Our Lord, grant us from our spouses and offspring comfort to our eyes.', ref: 'Quran 25:74' },
  { ar: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ', en: 'O Allah, suffice me with Your lawful against Your unlawful.', ref: 'Tirmidhi' },
  { ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ', en: 'In the name of Allah, with whose name nothing harms.', ref: 'Abu Dawud' },
  { ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', en: 'I seek refuge in the perfect words of Allah from the evil of what He created.', ref: 'Muslim' },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا', en: 'O Allah, I ask You for beneficial knowledge and wholesome provision.', ref: 'Ibn Majah' },
  { ar: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', en: 'My Lord, forgive me and accept my repentance; You are the Most Forgiving, Most Merciful.', ref: 'Abu Dawud' },
  { ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', en: 'Allah is sufficient for us, and He is the best Disposer of affairs.', ref: 'Quran 3:173' },
  { ar: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', en: 'There is no deity but You; glory be to You. Indeed, I have been of the wrongdoers.', ref: 'Quran 21:87' },
  { ar: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا', en: 'O Allah, bless for us what You have provided us.', ref: 'Ibn Majah' },
  { ar: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ', en: 'Our Lord, accept from us; indeed You are the Hearing, the Knowing.', ref: 'Quran 2:127' },
  { ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', en: 'Glory be to Allah and praise Him.', ref: 'Bukhari, Muslim' },
  { ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ', en: 'O Allah, I seek refuge in You from the punishment of the grave.', ref: 'Bukhari' },
  { ar: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي', en: 'My Lord, make me an establisher of prayer, and from my descendants.', ref: 'Quran 14:40' },
  { ar: 'اللَّهُمَّ أَحْسِنْ عَاقِبَتَنَا فِي الْأُمُورِ كُلِّهَا', en: 'O Allah, make good our outcome in all matters.', ref: 'Ahmad' },
  { ar: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', en: 'O Ever-Living, O Sustainer, by Your mercy I seek relief.', ref: 'Tirmidhi' },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ', en: 'O Allah, I ask You for Paradise.', ref: 'Abu Dawud' },
  { ar: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا', en: 'Our Lord, pour upon us patience and make our feet firm.', ref: 'Quran 2:250' },
  { ar: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي', en: 'O Allah, grant me health in my body.', ref: 'Abu Dawud' },
  { ar: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', en: 'I seek refuge in Allah from Satan, the accursed.', ref: 'Quran 16:98' },
  { ar: 'اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ', en: 'O Allah, to You belongs all praise.', ref: 'Ahmad' },
  { ar: 'رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ', en: 'Our Lord, do not burden us with what we cannot bear.', ref: 'Quran 2:286' },
  { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ حُسْنَ الْخَاتِمَةِ', en: 'O Allah, I ask You for a good ending.', ref: 'Tirmidhi' },
];
