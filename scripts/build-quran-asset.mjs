// Builds assets/data/quran.json in the shape the reader screens expect:
// { surahs: [ { n, verses: [ { n, ar, en, ur, hi } ] } ] }
// Source: src/data/quran-{ar,en,ur,hi}.json produced by scripts/build-quran.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '../src/data');
const OUT = join(here, '../assets/data');
mkdirSync(OUT, { recursive: true });

const load = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
const ar = load('quran-ar.json');
const en = load('quran-en.json');
const ur = load('quran-ur.json');
const hi = load('quran-hi.json');

const surahs = [];
for (let s = 1; s <= 114; s++) {
  const a = ar[String(s)] || [];
  const verses = a.map((text, i) => ({
    n: i + 1,
    ar: text,
    en: (en[String(s)] || [])[i] || '',
    ur: (ur[String(s)] || [])[i] || '',
    hi: (hi[String(s)] || [])[i] || '',
  }));
  surahs.push({ n: s, verses });
}

writeFileSync(join(OUT, 'quran.json'), JSON.stringify({ surahs }));
const total = surahs.reduce((c, s) => c + s.verses.length, 0);
console.log(`wrote assets/data/quran.json: ${surahs.length} surahs, ${total} ayahs`);
