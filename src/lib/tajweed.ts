/**
 * Tajweed color-coding utility for Quran Arabic text.
 *
 * Applies standard tajweed color rules to Arabic text so readers can
 * see pronunciation rules visually (like Muslim Pro's colored tajweed).
 *
 * Standard color scheme:
 * - Red (#D32F2F): Qalqalah (echoing letters ق ط ب ج د with sukoon)
 * - Orange (#F57C00): Idgham (merging - noon/meem assimilation)
 * - Green (#2E7D32): Ikhfa (concealment - noon/meem hiding)
 * - Blue (#1565C0): Madd (elongation)
 * - Purple (#7B1FA2): Iqlab (conversion - noon to meem)
 * - Teal (#00796B): Ghunnah (nasalization)
 */

export interface TajweedSegment {
  text: string;
  color: string | null; // null = default text color
  rule: string | null;  // rule name for legend/tooltip
}

export const TAJWEED_COLORS = {
  qalqalah: '#D32F2F',   // Red - echoing sound
  idgham: '#F57C00',     // Orange - merging
  ikhfa: '#2E7D32',      // Green - concealment
  madd: '#1565C0',       // Blue - elongation
  iqlab: '#7B1FA2',      // Purple - noon→meem conversion
  ghunnah: '#00796B',    // Teal - nasal sound
} as const;

export const TAJWEED_LEGEND: { color: string; rule: string; description: string }[] = [
  { color: TAJWEED_COLORS.qalqalah, rule: 'Qalqalah', description: 'Echoing sound (ق ط ب ج د)' },
  { color: TAJWEED_COLORS.idgham, rule: 'Idgham', description: 'Merging of sounds' },
  { color: TAJWEED_COLORS.ikhfa, rule: 'Ikhfa', description: 'Concealment (light nasal)' },
  { color: TAJWEED_COLORS.madd, rule: 'Madd', description: 'Elongation (stretch sound)' },
  { color: TAJWEED_COLORS.iqlab, rule: 'Iqlab', description: 'Noon becomes Meem' },
  { color: TAJWEED_COLORS.ghunnah, rule: 'Ghunnah', description: 'Nasalization (2 counts)' },
];

// Arabic diacritics
const SUKOON = '\u0652';
const SHADDA = '\u0651';
const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';
const TANWEEN_FATHA = '\u064B';
const TANWEEN_DAMMA = '\u064C';
const TANWEEN_KASRA = '\u064D';

// Qalqalah letters: ق ط ب ج د
const QALQALAH_LETTERS = new Set(['\u0642', '\u0637', '\u0628', '\u062C', '\u062F']);

// Idgham letters (after noon sakinah): ي ر م ل و ن
const IDGHAM_LETTERS = new Set(['\u064A', '\u0631', '\u0645', '\u0644', '\u0648', '\u0646']);

// Ikhfa letters (after noon sakinah): ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك
const IKHFA_LETTERS = new Set([
  '\u062A', '\u062B', '\u062C', '\u062F', '\u0630', '\u0632',
  '\u0633', '\u0634', '\u0635', '\u0636', '\u0637', '\u0638',
  '\u0641', '\u0642', '\u0643',
]);

// Izhar letters (after noon sakinah): ء ه ع ح غ خ
const IZHAR_LETTERS = new Set(['\u0621', '\u0647', '\u0639', '\u062D', '\u063A', '\u062E']);

// Madd letters: ا و ي
const MADD_LETTERS = new Set(['\u0627', '\u0648', '\u064A']);

// Noon and Meem
const NOON = '\u0646';
const MEEM = '\u0645';
const BA = '\u0628';

function isNoonSakinah(text: string, i: number): boolean {
  // Noon with sukoon, or tanween (which implies noon sound)
  if (text[i] !== NOON) return false;
  const next = text[i + 1];
  return next === SUKOON;
}

function isTanween(char: string): boolean {
  return char === TANWEEN_FATHA || char === TANWEEN_DAMMA || char === TANWEEN_KASRA;
}

function getBaseLetter(text: string, i: number): string {
  // Skip diacritics to find the actual letter
  let j = i;
  while (j < text.length && isDiacritic(text[j])) j++;
  return j < text.length ? text[j] : '';
}

function isDiacritic(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x064B && code <= 0x0652;
}

function isArabicLetter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0621 && code <= 0x064A;
}

/**
 * Apply tajweed color rules to Arabic Quran text.
 * Returns segments with color annotations.
 */
export function applyTajweed(arabicText: string): TajweedSegment[] {
  const segments: TajweedSegment[] = [];
  let current = '';
  let currentColor: string | null = null;
  let currentRule: string | null = null;

  function pushSegment() {
    if (current) {
      segments.push({ text: current, color: currentColor, rule: currentRule });
      current = '';
      currentColor = null;
      currentRule = null;
    }
  }

  function appendWith(char: string, color: string | null, rule: string | null) {
    if (color !== currentColor) {
      pushSegment();
      currentColor = color;
      currentRule = rule;
    }
    current += char;
  }

  let i = 0;
  while (i < arabicText.length) {
    const char = arabicText[i];
    const nextChar = arabicText[i + 1] || '';
    const nextNextChar = arabicText[i + 2] || '';

    // --- Qalqalah: ق ط ب ج د with sukoon ---
    if (QALQALAH_LETTERS.has(char) && nextChar === SUKOON) {
      appendWith(char, TAJWEED_COLORS.qalqalah, 'Qalqalah');
      appendWith(nextChar, TAJWEED_COLORS.qalqalah, 'Qalqalah');
      i += 2;
      continue;
    }

    // --- Noon Sakinah rules ---
    if (isNoonSakinah(arabicText, i)) {
      // Look ahead past sukoon to find next letter
      let j = i + 2;
      while (j < arabicText.length && !isArabicLetter(arabicText[j])) j++;
      const nextLetter = arabicText[j] || '';

      if (nextLetter === BA) {
        // Iqlab: noon + ba → meem sound
        appendWith(char, TAJWEED_COLORS.iqlab, 'Iqlab');
        appendWith(nextChar, TAJWEED_COLORS.iqlab, 'Iqlab');
      } else if (IDGHAM_LETTERS.has(nextLetter)) {
        // Idgham: merging
        const isGhunnah = ['\u064A', '\u0645', '\u0648', '\u0646'].includes(nextLetter);
        const color = isGhunnah ? TAJWEED_COLORS.ghunnah : TAJWEED_COLORS.idgham;
        const rule = isGhunnah ? 'Ghunnah' : 'Idgham';
        appendWith(char, color, rule);
        appendWith(nextChar, color, rule);
      } else if (IKHFA_LETTERS.has(nextLetter)) {
        // Ikhfa: concealment
        appendWith(char, TAJWEED_COLORS.ikhfa, 'Ikhfa');
        appendWith(nextChar, TAJWEED_COLORS.ikhfa, 'Ikhfa');
      } else {
        // Izhar or default - no color
        appendWith(char, null, null);
        appendWith(nextChar, null, null);
      }
      i += 2;
      continue;
    }

    // --- Tanween rules (similar to noon sakinah) ---
    if (isTanween(char)) {
      let j = i + 1;
      while (j < arabicText.length && !isArabicLetter(arabicText[j])) j++;
      const nextLetter = arabicText[j] || '';

      if (nextLetter === BA) {
        appendWith(char, TAJWEED_COLORS.iqlab, 'Iqlab');
      } else if (IDGHAM_LETTERS.has(nextLetter)) {
        const isGhunnah = ['\u064A', '\u0645', '\u0648', '\u0646'].includes(nextLetter);
        appendWith(char, isGhunnah ? TAJWEED_COLORS.ghunnah : TAJWEED_COLORS.idgham, isGhunnah ? 'Ghunnah' : 'Idgham');
      } else if (IKHFA_LETTERS.has(nextLetter)) {
        appendWith(char, TAJWEED_COLORS.ikhfa, 'Ikhfa');
      } else {
        appendWith(char, null, null);
      }
      i += 1;
      continue;
    }

    // --- Meem Sakinah + Ba → Ikhfa Shafawi ---
    if (char === MEEM && nextChar === SUKOON) {
      let j = i + 2;
      while (j < arabicText.length && !isArabicLetter(arabicText[j])) j++;
      const nextLetter = arabicText[j] || '';
      if (nextLetter === BA || nextLetter === MEEM) {
        appendWith(char, TAJWEED_COLORS.ikhfa, 'Ikhfa');
        appendWith(nextChar, TAJWEED_COLORS.ikhfa, 'Ikhfa');
        i += 2;
        continue;
      }
    }

    // --- Madd: harakah + madd letter ---
    if ((char === FATHA || char === DAMMA || char === KASRA) &&
        MADD_LETTERS.has(nextChar)) {
      // Check if it's a madd situation (simplified)
      const isMadd =
        (char === FATHA && nextChar === '\u0627') ||
        (char === DAMMA && nextChar === '\u0648') ||
        (char === KASRA && nextChar === '\u064A');
      if (isMadd) {
        // Don't color the harakah, but color the madd letter
        appendWith(char, null, null);
        // The madd letter will be colored in next iteration
        i += 1;
        continue;
      }
    }

    // Madd letter after appropriate vowel - color it blue
    if (MADD_LETTERS.has(char)) {
      const prevChar = arabicText[i - 1] || '';
      const isMaddLetter =
        (prevChar === FATHA && char === '\u0627') ||
        (prevChar === DAMMA && char === '\u0648') ||
        (prevChar === KASRA && char === '\u064A');
      if (isMaddLetter) {
        // Include any following diacritics
        appendWith(char, TAJWEED_COLORS.madd, 'Madd');
        i += 1;
        continue;
      }
    }

    // --- Shadda after noon/meem → Ghunnah ---
    if ((char === NOON || char === MEEM) && nextChar === SHADDA) {
      appendWith(char, TAJWEED_COLORS.ghunnah, 'Ghunnah');
      appendWith(nextChar, TAJWEED_COLORS.ghunnah, 'Ghunnah');
      i += 2;
      continue;
    }

    // Default: no tajweed color
    appendWith(char, null, null);
    i += 1;
  }

  pushSegment();
  return segments;
}

/**
 * Check if text contains any tajweed-applicable patterns.
 * Used to decide whether to show the tajweed toggle.
 */
export function hasTajweedMarkers(arabicText: string): boolean {
  const segments = applyTajweed(arabicText);
  return segments.some(s => s.color !== null);
}
