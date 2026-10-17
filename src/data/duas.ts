// Curated dua collection — Arabic (standard texts), English, Urdu, Hindi meanings.
// Categories for the Dua library screen.

export interface Dua {
  id: string;
  category: string;
  ar: string;
  en: string;
  ur: string;
  hi: string;
  ref?: string;
}

export const DUA_CATEGORIES = [
  'Daily Life',
  'Morning & Evening',
  'Prayer (Salah)',
  'Forgiveness',
  'Protection',
  'Sustenance & Rizq',
  'Family',
  'Hardship & Anxiety',
] as const;

export const DUAS: Dua[] = [
  {
    id: 'rabbana-atina', category: 'Daily Life',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    en: 'Our Lord, give us good in this world and good in the Hereafter, and shield us from the punishment of the Fire.',
    ur: 'اے ہمارے رب! ہمیں دنیا میں بھلائی دے اور آخرت میں بھی بھلائی دے، اور ہمیں آگ کے عذاب سے بچا۔',
    hi: 'ऐ हमारे रब! हमें दुनिया में भलाई दे और आखिरत में भी भलाई दे, और हमें आग के अज़ाब से बचा।',
    ref: 'Quran 2:201',
  },
  {
    id: 'allahumma-inni-as-aluka', category: 'Daily Life',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    en: 'O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds.',
    ur: 'اے اللہ! میں تجھ سے نفع بخش علم، پاکیزہ رزق اور مقبول عمل مانگتا ہوں۔',
    hi: 'ऐ अल्लाह! मैं तुझसे नफा बख्श इल्म, पाकीज़ा रिज़्क और मक़बूल अमल मांगता हूँ।',
    ref: 'Ibn Majah',
  },
  {
    id: 'bismillah-alladhi', category: 'Morning & Evening',
    ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    en: 'In the name of Allah, with Whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, All-Knowing. (3x)',
    ur: 'اللہ کے نام سے جس کے نام سے زمین و آسمان میں کوئی چیز نقصان نہیں پہنچا سکتی، اور وہ سننے والا جاننے والا ہے۔ (3 بار)',
    hi: 'अल्लाह के नाम से, जिसके नाम से ज़मीन और आसमान में कोई चीज़ नुकसान नहीं पहुँचा सकती, और वह सुनने वाला, जानने वाला है। (3 बार)',
    ref: 'Abu Dawud, Tirmidhi',
  },
  {
    id: 'audhu-bi-kalimat', category: 'Protection',
    ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    en: 'I seek refuge in the perfect words of Allah from the evil of what He created. (3x)',
    ur: 'میں اللہ کے کامل کلمات کی پناہ مانگتا ہوں اس کے شر سے جو اس نے پیدا کیا۔ (3 بار)',
    hi: 'मैं अल्लाह के कामिल कलिमात की पनाह मांगता हूँ, उस शर से जो उसने पैदा किया। (3 बार)',
    ref: 'Muslim',
  },
  {
    id: 'allahumma-ajirni', category: 'Protection',
    ar: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
    en: 'O Allah, protect me from the Fire. (7x after Fajr & Maghrib)',
    ur: 'اے اللہ! مجھے آگ سے بچا۔ (فجر و مغرب کے بعد 7 بار)',
    hi: 'ऐ अल्लाह! मुझे आग से बचा। (फज्र और मगरिब के बाद 7 बार)',
    ref: 'Abu Dawud',
  },
  {
    id: 'rabbighfirli', category: 'Forgiveness',
    ar: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    en: 'My Lord, forgive me and accept my repentance; indeed You are the Acceptor of Repentance, the Merciful.',
    ur: 'اے میرے رب! مجھے بخش دے اور میری توبہ قبول فرما، بے شک تو توبہ قبول کرنے والا رحم کرنے والا ہے۔',
    hi: 'ऐ मेरे रब! मुझे बख्श दे और मेरी तौबा क़बूल फरमा, बेशक तू तौबा क़बूल करने वाला, रहम करने वाला है।',
    ref: 'Abu Dawud, Tirmidhi',
  },
  {
    id: 'sayyidul-istighfar', category: 'Forgiveness',
    ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    en: 'O Allah, You are my Lord, none has the right to be worshipped but You. You created me and I am Your servant... I seek refuge in You from the evil of what I have done... so forgive me, for none forgives sins but You.',
    ur: 'اے اللہ! تو میرا رب ہے، تیرے سوا کوئی معبود نہیں، تو نے مجھے پیدا کیا اور میں تیرا بندہ ہوں... تو مجھے بخش دے، کیونکہ تیرے سوا گناہوں کو کوئی نہیں بخشتا۔',
    hi: 'ऐ अल्लाह! तू मेरा रब है, तेरे सिवा कोई माबूद नहीं, तूने मुझे पैदा किया और मैं तेरा बंदा हूँ... तू मुझे बख्श दे, क्योंकि तेरे सिवा गुनाहों को कोई नहीं बख्शता।',
    ref: 'Bukhari (Sayyid al-Istighfar)',
  },
  {
    id: 'allahumma-inni-audhu-ham', category: 'Hardship & Anxiety',
    ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ',
    en: 'O Allah, I seek refuge in You from anxiety and grief, from weakness and laziness, from miserliness and cowardice, from the burden of debt and the oppression of men.',
    ur: 'اے اللہ! میں تیری پناہ مانگتا ہوں فکر و غم سے، عاجزی و سستی سے، بخل و بزدلی سے، قرض کے بوجھ سے اور لوگوں کے غلبے سے۔',
    hi: 'ऐ अल्लाह! मैं तेरी पनाह मांगता हूँ फिक्र और ग़म से, आजिज़ी और सुस्ती से, बुख्ल और बुज़दिली से, क़र्ज़ के बोझ से और लोगों के ग़ल्बे से।',
    ref: 'Bukhari',
  },
  {
    id: 'hasbunallah', category: 'Hardship & Anxiety',
    ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    en: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
    ur: 'ہمیں اللہ کافی ہے اور وہ بہترین کارساز ہے۔',
    hi: 'हमें अल्लाह काफी है और वह बेहतरीन कारसाज़ है।',
    ref: 'Quran 3:173',
  },
  {
    id: 'la-ilaha-illa-anta', category: 'Hardship & Anxiety',
    ar: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    en: 'None has the right to be worshipped but You. Glory be to You; indeed I have been of the wrongdoers.',
    ur: 'تیرے سوا کوئی معبود نہیں، تو پاک ہے، بے شک میں ظالموں میں سے ہوں۔',
    hi: 'तेरे सिवा कोई माबूद नहीं, तू पाक है, बेशक मैं ज़ालिमों में से हूँ।',
    ref: 'Quran 21:87 (Dua of Yunus AS)',
  },
  {
    id: 'allahumma-rzuqni', category: 'Sustenance & Rizq',
    ar: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    en: 'O Allah, suffice me with what You have made lawful against what You have made unlawful, and enrich me by Your bounty over all besides You.',
    ur: 'اے اللہ! مجھے اپنے حلال سے حرام سے بے نیاز کر دے اور اپنے فضل سے اپنے سوا سب سے بے نیاز کر دے۔',
    hi: 'ऐ अल्लाह! मुझे अपने हलाल से हराम से बेनियाज़ कर दे और अपने फ़ज़्ल से अपने सिवा सबसे बेनियाज़ कर दे।',
    ref: 'Tirmidhi',
  },
  {
    id: 'rabbi-shrahli', category: 'Daily Life',
    ar: 'رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي، يَفْقَهُوا قَوْلِي',
    en: 'My Lord, expand for me my chest, ease for me my task, and untie the knot from my tongue, that they may understand my speech.',
    ur: 'اے میرے رب! میرا سینہ کھول دے، میرا کام آسان کر دے، اور میری زبان کی گرہ کھول دے تاکہ وہ میری بات سمجھیں۔',
    hi: 'ऐ मेरे रब! मेरा सीना खोल दे, मेरा काम आसान कर दे, और मेरी ज़बान की गिरह खोल दे ताकि वे मेरी बात समझें।',
    ref: 'Quran 20:25-28 (Dua of Musa AS)',
  },
  {
    id: 'allahumma-hdini', category: 'Prayer (Salah)',
    ar: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ',
    en: 'O Allah, guide me among those You have guided, grant me health among those You have granted health, befriend me among those You have befriended, bless for me what You have given, and shield me from the evil of what You have decreed.',
    ur: 'اے اللہ! مجھے ہدایت دے ان میں جنہیں تو نے ہدایت دی، مجھے عافیت دے ان میں جنہیں تو نے عافیت دی...',
    hi: 'ऐ अल्लाह! मुझे हिदायत दे उनमें जिन्हें तूने हिदायत दी, मुझे आफियत दे उनमें जिन्हें तूने आफियत दी, मुझे दोस्त बना उनमें जिन्हें तूने दोस्त बनाया, जो तूने दिया उसमें बरकत दे, और मुझे बचा उस शर से जो तूने मुक़द्दर किया।',
    ref: 'Abu Dawud, Tirmidhi (Dua-e-Qunut)',
  },
  {
    id: 'subhanallah-wabihamdihi', category: 'Morning & Evening',
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    en: 'Glory be to Allah and praise Him. (100x — sins forgiven even if like sea foam)',
    ur: 'اللہ پاک ہے اور اسی کی حمد ہے۔ (100 بار — سمندر کی جھاگ برابر بھی گناہ ہوں تو معاف)',
    hi: 'अल्लाह पाक है और उसी की हम्द है। (100 बार - समंदर की झाग बराबर भी गुनाह हों तो माफ)',
    ref: 'Bukhari, Muslim',
  },
  {
    id: 'la-hawla', category: 'Daily Life',
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    en: 'There is no power nor strength except with Allah. (A treasure of Paradise)',
    ur: 'نہ کوئی طاقت نہ قوت مگر اللہ کی مدد سے۔ (جنت کا خزانہ)',
    hi: 'न कोई ताक़त न क़ुव्वत मगर अल्लाह की मदद से। (जन्नत का खज़ाना)',
    ref: 'Bukhari, Muslim',
  },
  {
    id: 'rabbana-hablana', category: 'Family',
    ar: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    en: 'Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us leaders of the righteous.',
    ur: 'اے ہمارے رب! ہمیں ہماری بیویوں اور اولاد سے آنکھوں کی ٹھنڈک عطا فرما اور ہمیں پرہیزگاروں کا امام بنا۔',
    hi: 'ऐ हमारे रब! हमें हमारी बीवियों और औलाद से आँखों की ठंडक अता फरमा और हमें परहेज़गारों का इमाम बना।',
    ref: 'Quran 25:74',
  },
  {
    id: 'allahumma-inni-as-alukal-jannah', category: 'Daily Life',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
    en: 'O Allah, I ask You for Paradise and seek refuge in You from the Fire.',
    ur: 'اے اللہ! میں تجھ سے جنت مانگتا ہوں اور آگ سے تیری پناہ مانگتا ہوں۔',
    hi: 'ऐ अल्लाह! मैं तुझसे जन्नत मांगता हूँ और आग से तेरी पनाह मांगता हूँ।',
    ref: 'Abu Dawud',
  },
  {
    id: 'allahumma-akhrijni', category: 'Daily Life',
    ar: 'اللَّهُمَّ أَخْرِجْنِي مِنْ ظُلُمَاتِ الْوَهْمِ، وَأَكْرِمْنِي بِنُورِ الْفَهْمِ',
    en: 'O Allah, bring me out of the darkness of delusion and honour me with the light of understanding.',
    ur: 'اے اللہ! مجھے وہم کے اندھیروں سے نکال اور فہم کے نور سے نواز۔',
    hi: 'ऐ अल्लाह! मुझे वहम के अँधेरों से निकाल और फ़हम के नूर से नवाज़।',
    ref: 'Traditional (for students)',
  },
  {
    id: 'bismillah-tawakkaltu', category: 'Daily Life',
    ar: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    en: 'In the name of Allah, I place my trust in Allah; there is no power nor strength except with Allah. (when leaving home)',
    ur: 'اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، نہ طاقت نہ قوت مگر اللہ سے۔ (گھر سے نکلتے وقت)',
    hi: 'अल्लाह के नाम से, मैंने अल्लाह पर भरोसा किया, न ताक़त न क़ुव्वत मगर अल्लाह से। (घर से निकलते वक़्त)',
    ref: 'Abu Dawud, Tirmidhi',
  },
  {
    id: 'allahumma-barik', category: 'Sustenance & Rizq',
    ar: 'اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي، وَقِنِي عَذَابَ النَّارِ',
    en: 'O Allah, bless for me what You have provided me, and shield me from the punishment of the Fire.',
    ur: 'اے اللہ! جو تو نے مجھے رزق دیا اس میں برکت دے اور مجھے آگ کے عذاب سے بچا۔',
    hi: 'ऐ अल्लाह! जो तूने मुझे रिज़्क दिया उसमें बरकत दे और मुझे आग के अज़ाब से बचा।',
    ref: 'Traditional',
  },
];
