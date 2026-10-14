// Builds compact Quran JSON assets from Tanzil-format txt files in ~/workspace/noor-data.
// Run: node scripts/build-quran.mjs
// Output: src/data/quran-ar.json, quran-en.json, quran-ur.json, quran-hi.json, surahs.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, '../../noor-data');
const OUT = join(here, '../src/data');
mkdirSync(OUT, { recursive: true });

function parse(file) {
  const text = readFileSync(join(DATA, file), 'utf8');
  const map = new Map(); // surah -> Map(ayah -> text)
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const i1 = line.indexOf('|');
    const i2 = line.indexOf('|', i1 + 1);
    if (i1 < 0 || i2 < 0) continue;
    const s = parseInt(line.slice(0, i1), 10);
    const a = parseInt(line.slice(i1 + 1, i2), 10);
    const t = line.slice(i2 + 1);
    if (!Number.isFinite(s) || !Number.isFinite(a) || s < 1 || s > 114) continue;
    if (!map.has(s)) map.set(s, new Map());
    if (!map.get(s).has(a)) map.get(s).set(a, t); // first wins
  }
  return map;
}

const ar = parse('quran-uthmani.txt');
const en = parse('trans_en.sahih.txt');
const ur = parse('trans_ur.jalandhry.txt');
const hi = parse('trans_hi.hindi.txt');

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const BISMILLAH_UTH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Surah names: [english transliteration, arabic name]
const NAMES = [
  ['Al-Fatihah','الفاتحة'],['Al-Baqarah','البقرة'],['Aal-e-Imran','آل عمران'],['An-Nisa','النساء'],
  ['Al-Ma\'idah','المائدة'],['Al-An\'am','الأنعام'],['Al-A\'raf','الأعراف'],['Al-Anfal','الأنفال'],
  ['At-Tawbah','التوبة'],['Yunus','يونس'],['Hud','هود'],['Yusuf','يوسف'],['Ar-Ra\'d','الرعد'],
  ['Ibrahim','إبراهيم'],['Al-Hijr','الحجر'],['An-Nahl','النحل'],['Al-Isra','الإسراء'],['Al-Kahf','الكهف'],
  ['Maryam','مريم'],['Ta-Ha','طه'],['Al-Anbya','الأنبياء'],['Al-Hajj','الحج'],['Al-Mu\'minun','المؤمنون'],
  ['An-Nur','النور'],['Al-Furqan','الفرقان'],['Ash-Shu\'ara','الشعراء'],['An-Naml','النمل'],
  ['Al-Qasas','القصص'],['Al-Ankabut','العنكبوت'],['Ar-Rum','الروم'],['Luqman','لقمان'],
  ['As-Sajdah','السجدة'],['Al-Ahzab','الأحزاب'],['Saba','سبأ'],['Fatir','فاطر'],['Ya-Sin','يس'],
  ['As-Saffat','الصافات'],['Sad','ص'],['Az-Zumar','الزمر'],['Ghafir','غافر'],['Fussilat','فصلت'],
  ['Ash-Shura','الشورى'],['Az-Zukhruf','الزخرف'],['Ad-Dukhan','الدخان'],['Al-Jathiyah','الجاثية'],
  ['Al-Ahqaf','الأحقاف'],['Muhammad','محمد'],['Al-Fath','الفتح'],['Al-Hujurat','الحجرات'],['Qaf','ق'],
  ['Adh-Dhariyat','الذاريات'],['At-Tur','الطور'],['An-Najm','النجم'],['Al-Qamar','القمر'],
  ['Ar-Rahman','الرحمن'],['Al-Waqi\'ah','الواقعة'],['Al-Hadid','الحديد'],['Al-Mujadila','المجادلة'],
  ['Al-Hashr','الحشر'],['Al-Mumtahanah','الممتحنة'],['As-Saff','الصف'],['Al-Jumu\'ah','الجمعة'],
  ['Al-Munafiqun','المنافقون'],['At-Taghabun','التغابن'],['At-Talaq','الطلاق'],['At-Tahrim','التحريم'],
  ['Al-Mulk','الملك'],['Al-Qalam','القلم'],['Al-Haqqah','الحاقة'],['Al-Ma\'arij','المعارج'],
  ['Nuh','نوح'],['Al-Jinn','الجن'],['Al-Muzzammil','المزمل'],['Al-Muddaththir','المدثر'],
  ['Al-Qiyamah','القيامة'],['Al-Insan','الإنسان'],['Al-Mursalat','المرسلات'],['An-Naba','النبأ'],
  ['An-Nazi\'at','النازعات'],['Abasa','عبس'],['At-Takwir','التكوير'],['Al-Infitar','الانفطار'],
  ['Al-Mutaffifin','المطففين'],['Al-Inshiqaq','الانشقاق'],['Al-Buruj','البروج'],['At-Tariq','الطارق'],
  ['Al-A\'la','الأعلى'],['Al-Ghashiyah','الغاشية'],['Al-Fajr','الفجر'],['Al-Balad','البلد'],
  ['Ash-Shams','الشمس'],['Al-Layl','الليل'],['Ad-Duha','الضحى'],['Ash-Sharh','الشرح'],['At-Tin','التين'],
  ['Al-Alaq','العلق'],['Al-Qadr','القدر'],['Al-Bayyinah','البينة'],['Az-Zalzalah','الزلزلة'],
  ['Al-Adiyat','العاديات'],['Al-Qari\'ah','القارعة'],['At-Takathur','التكاثر'],['Al-Asr','العصر'],
  ['Al-Humazah','الهمزة'],['Al-Fil','الفيل'],['Quraysh','قريش'],['Al-Ma\'un','الماعون'],
  ['Al-Kawthar','الكوثر'],['Al-Kafirun','الكافرون'],['An-Nasr','النصر'],['Al-Masad','المسد'],
  ['Al-Ikhlas','الإخلاص'],['Al-Falaq','الفلق'],['An-Nas','الناس'],
];

// Madinan surahs (rest are Makkan)
const MADANI = new Set([2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,110]);

const surahs = [];
const qAr = {}, qEn = {}, qUr = {}, qHi = {};
let totalAyahs = 0, missing = [];

for (let s = 1; s <= 114; s++) {
  const arMap = ar.get(s) || new Map();
  const ayahs = [...arMap.keys()].sort((a, b) => a - b);
  // Strip prefixed Bismillah from first ayah (surahs 2..114 except 9) for display
  const arArr = ayahs.map(a => {
    let t = arMap.get(a);
    if (a === 1 && s !== 1 && s !== 9 && t.startsWith(BISMILLAH_UTH)) {
      t = t.slice(BISMILLAH_UTH.length).trim();
    }
    return t;
  });
  const getT = (m) => ayahs.map(a => (m.get(s) || new Map()).get(a) || '');
  const enArr = getT(en), urArr = getT(ur), hiArr = getT(hi);
  if (ayahs.length === 0) missing.push(s);
  totalAyahs += ayahs.length;
  qAr[s] = arArr; qEn[s] = enArr; qUr[s] = urArr; qHi[s] = hiArr;
  surahs.push({
    n: s,
    en: NAMES[s - 1][0],
    ar: NAMES[s - 1][1],
    ayahs: ayahs.length,
    type: MADANI.has(s) ? 'Madani' : 'Makki',
    bismillah: s !== 1 && s !== 9, // show Bismillah header before ayah 1
  });
}

writeFileSync(join(OUT, 'quran-ar.json'), JSON.stringify(qAr));
writeFileSync(join(OUT, 'quran-en.json'), JSON.stringify(qEn));
writeFileSync(join(OUT, 'quran-ur.json'), JSON.stringify(qUr));
writeFileSync(join(OUT, 'quran-hi.json'), JSON.stringify(qHi));
writeFileSync(join(OUT, 'surahs.json'), JSON.stringify(surahs));

console.log(`surahs: ${surahs.length}, total ayahs: ${totalAyahs}, missing surahs: ${missing.join(',') || 'none'}`);
// sanity: surah 1 = 7, surah 2 = 286, surah 114 = 6
const counts = [1, 2, 9, 36, 112, 113, 114].map(s => `${s}:${(ar.get(s) || new Map()).size}`).join(' ');
console.log('ayah counts:', counts);
