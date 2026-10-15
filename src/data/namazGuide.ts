// Step-by-step Namaz guide — Wudu + Salah per the Hanafi method.
// Arabic duas are classical (public domain); explanations in simple English.

export interface GuideStep {
  title: string;
  desc: string;
  duaAr?: string;
  duaEn?: string;
}

export const WUDU_STEPS: GuideStep[] = [
  {
    title: 'Make Niyyah (intention)',
    desc: 'In your heart, intend that you are performing wudu to purify yourself for prayer. You do not need to say it out loud.',
  },
  {
    title: 'Say Bismillah and wash hands',
    desc: 'Say "Bismillah" and wash both hands up to the wrists 3 times, making sure water reaches between the fingers.',
    duaAr: 'بِسْمِ اللَّهِ',
    duaEn: 'In the name of Allah.',
  },
  {
    title: 'Rinse the mouth',
    desc: 'Take water into your mouth and rinse it thoroughly 3 times. If you are not fasting, gargle lightly.',
  },
  {
    title: 'Rinse the nose',
    desc: 'Sniff water gently into the nose and blow it out 3 times, using the left hand to clean the nose.',
  },
  {
    title: 'Wash the face',
    desc: 'Wash the entire face 3 times — from the hairline to the chin, and ear to ear. Run wet fingers through the beard.',
  },
  {
    title: 'Wash the arms',
    desc: 'Wash the right arm up to and including the elbow 3 times, then the left arm 3 times. No spot should stay dry.',
  },
  {
    title: 'Masah — wipe the head and ears',
    desc: 'With wet hands, wipe over the head once from front to back and back to front. Then wipe inside and behind the ears with the fingers.',
  },
  {
    title: 'Wash the feet',
    desc: 'Wash the right foot up to and including the ankle 3 times, then the left foot 3 times. Wash between the toes. Then recite the shahada.',
    duaAr: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    duaEn: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and Messenger.',
  },
];

export const NAMAZ_STEPS: GuideStep[] = [
  {
    title: 'Niyyah — make intention',
    desc: 'Stand facing the Qibla. In your heart, intend which prayer you are about to perform (e.g. "I intend to pray 2 fard rakats of Fajr").',
  },
  {
    title: 'Takbir — begin the prayer',
    desc: 'Raise both hands to the ears (thumbs touching earlobes) and say "Allahu Akbar". Then fold your hands below the navel — right hand over left.',
    duaAr: 'اللَّهُ أَكْبَرُ',
    duaEn: 'Allah is the Greatest.',
  },
  {
    title: 'Qiyam — standing and recitation',
    desc: 'Recite the Sana, then Surah Al-Fatiha, then another surah (or a few verses) in the first two rakats. Stand calmly with eyes lowered toward the place of sajda.',
    duaAr: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ',
    duaEn: 'Glory be to You, O Allah, and praise be to You. Blessed is Your name and exalted is Your majesty. There is no god but You. (Sana)',
  },
  {
    title: 'Ruku — bowing',
    desc: 'Say "Allahu Akbar" and bow so the back is level, hands resting on the knees. Recite the ruku dua 3 times (or more, odd number).',
    duaAr: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    duaEn: 'Glory be to my Lord, the Most Great.',
  },
  {
    title: 'Sajda — prostration',
    desc: 'Say "Allahu Akbar" and prostrate: forehead, nose, both palms, both knees and toes touching the ground. Recite the sajda dua 3 times. Perform two sajdas, sitting briefly between them.',
    duaAr: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    duaEn: 'Glory be to my Lord, the Most High.',
  },
  {
    title: 'Tashahhud — sitting and testimony',
    desc: 'In the final sitting, recite At-Tahiyyat, then Durood-e-Ibrahim, then a short dua (e.g. Rabbana Atina). Raise the right index finger when reciting the shahada portion.',
    duaAr: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    duaEn: 'All greetings, prayers and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and Messenger.',
  },
  {
    title: 'Salam — ending the prayer',
    desc: 'Turn your face to the right and say the salam, then to the left and repeat it. This ends the prayer.',
    duaAr: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    duaEn: 'Peace be upon you and the mercy of Allah.',
  },
];
