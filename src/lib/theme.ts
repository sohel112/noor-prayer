// App color system — NOOR Clean UI: white surfaces, deep green primary, gold accents.
// Matches the NOOR Clean UI/UX Concept design spec.

export interface Theme {
  bg: string;
  card: string;
  text: string;
  sub: string;
  /** Primary green #0F6B4F */
  primary: string;
  primaryDark: string;
  /** Accent gold/tan #D4AF7C */
  accent: string;
  accentSoft: string;
  border: string;
  /** Text on primary backgrounds */
  onPrimary: string;
  success: string;
  danger: string;
  /** Card shadow color */
  shadow: string;
  /** Muted chip/pill background */
  chip: string;
  /** @deprecated use accent (gold) instead */
  gold: string;
  /** @deprecated use onPrimary instead */
  onAccent: string;
}

export const LIGHT: Theme = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  sub: '#6B7280',
  primary: '#0F6B4F',
  primaryDark: '#0A4A37',
  accent: '#D4AF7C',
  accentSoft: '#FBF4E8',
  border: '#E9EDEF',
  onPrimary: '#FFFFFF',
  success: '#0F6B4F',
  danger: '#DC2626',
  shadow: '#1F2937',
  chip: '#EDF2F0',
  gold: '#D4AF7C',
  onAccent: '#FFFFFF',
};

export const DARK: Theme = {
  bg: '#0F1419',
  card: '#182029',
  text: '#F3F4F6',
  sub: '#9CA3AF',
  primary: '#149A6C',
  primaryDark: '#0F6B4F',
  accent: '#D4AF7C',
  accentSoft: '#2A2417',
  border: '#26313D',
  onPrimary: '#FFFFFF',
  success: '#34D399',
  danger: '#F87171',
  shadow: '#000000',
  chip: '#1F2937',
  gold: '#D4AF7C',
  onAccent: '#FFFFFF',
};

/** Font families — loaded via expo-font (@expo-google-fonts). Use after fonts are ready. */
export const FONTS = {
  heading: 'PlayfairDisplay_700Bold',
  headingSemi: 'PlayfairDisplay_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};
