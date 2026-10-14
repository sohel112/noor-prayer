// App color system — calm, respectful Islamic aesthetic.

export interface Theme {
  bg: string;
  card: string;
  text: string;
  sub: string;
  accent: string;
  accentSoft: string;
  border: string;
}

export const LIGHT: Theme = {
  bg: '#F7F5EF',
  card: '#FFFFFF',
  text: '#1C2B21',
  sub: '#6B7A6E',
  accent: '#0E6B3A',
  accentSoft: '#E3F2E8',
  border: '#E4E0D3',
};

export const DARK: Theme = {
  bg: '#0B1D13',
  card: '#122A1B',
  text: '#F2EFE4',
  sub: '#9DB3A3',
  accent: '#3ECF7A',
  accentSoft: '#16382A',
  border: '#1E3A2A',
};
