// Prayer-time engine — clean-room implementation of standard solar-position
// astronomy (the same public-domain math behind every major prayer timetable).
// Everything runs on-device: no network, no API, no server.
//
// Conventions:
//   - Angles in degrees, times as fractional hours in LOCAL time.
//   - Latitude/longitude in decimal degrees (N/E positive).

export type AsrJuristic = 'shafi' | 'hanafi'; // shadow factor 1 | 2
export type HighLatitudeRule = 'none' | 'angle' | 'midnight' | 'oneseventh';

export interface PrayerMethod {
  id: string;
  name: string;
  fajrAngle: number;
  ishaAngle: number;
  /** minutes added to sunset for Maghrib (used instead of angle by some methods) */
  maghribMinutes?: number;
  /** sun depression angle for Maghrib (Tehran/Jafari use ~4°) */
  maghribAngle?: number;
  /** minutes added to Maghrib for Isha (alternative to angle) */
  ishaMinutes?: number;
}

export const PRAYER_METHODS: PrayerMethod[] = [
  { id: 'mwl', name: 'Muslim World League', fajrAngle: 18, ishaAngle: 17 },
  { id: 'isna', name: 'ISNA (North America)', fajrAngle: 15, ishaAngle: 15 },
  { id: 'egypt', name: 'Egyptian General Authority', fajrAngle: 19.5, ishaAngle: 17.5 },
  { id: 'karachi', name: 'Univ. of Islamic Sciences, Karachi', fajrAngle: 18, ishaAngle: 18 },
  { id: 'tehran', name: 'Institute of Geophysics, Tehran', fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  { id: 'jafari', name: "Jafari (Ithna Ashari)", fajrAngle: 16, ishaAngle: 14, maghribAngle: 4 },
];

export interface PrayerTimes {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface CalcOptions {
  methodId: string;
  asrJuristic: AsrJuristic;
  highLatitudeRule: HighLatitudeRule;
  /** manual per-prayer minute adjustments */
  adjustments: Partial<Record<keyof PrayerTimes, number>>;
  /** minutes added to Dhuhr (many timetables add ~2) */
  dhuhrOffsetMinutes: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function fixAngle(a: number): number {
  a = a % 360;
  return a < 0 ? a + 360 : a;
}
function fixHour(h: number): number {
  h = h % 24;
  return h < 0 ? h + 24 : h;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

interface SunPos { declination: number; equation: number; }

function sunPosition(jd: number): SunPos {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const L = fixAngle(q + 1.915 * Math.sin(g * D2R) + 0.02 * Math.sin(2 * g * D2R));
  const e = 23.439 - 0.00000036 * d;
  const RA = R2D * Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) / 15;
  const declination = R2D * Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R));
  const equation = q / 15 - fixHour(RA);
  return { declination, equation };
}

/** Hour-angle (in hours) for the sun at a given depression/elevation angle. NaN if the sun never reaches it. */
function hourAngle(lat: number, decl: number, angleDeg: number): number {
  const num = Math.sin(angleDeg * D2R) - Math.sin(lat * D2R) * Math.sin(decl * D2R);
  const den = Math.cos(lat * D2R) * Math.cos(decl * D2R);
  const cosH = num / den;
  if (cosH < -1 || cosH > 1) return NaN;
  return (R2D * Math.acos(clamp(cosH, -1, 1))) / 15;
}

const SUNRISE_ANGLE = -0.833; // geometric sunrise/sunset incl. refraction

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  opts: CalcOptions,
): PrayerTimes {
  const method = PRAYER_METHODS.find(m => m.id === opts.methodId) ?? PRAYER_METHODS[0];
  const tz = -date.getTimezoneOffset() / 60; // local UTC offset in hours
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / 360;
  const { declination: decl, equation: eqt } = sunPosition(jd);
  const midDay = fixHour(12 - eqt);

  const toLocal = (h: number) => fixHour(h + tz - lng / 15);

  const sunriseH = hourAngle(lat, decl, SUNRISE_ANGLE);
  const fajrH = hourAngle(lat, decl, -method.fajrAngle);
  const ishaH = hourAngle(lat, decl, -method.ishaAngle);

  let fajr = toLocal(midDay - fajrH);
  let sunrise = toLocal(midDay - sunriseH);
  let sunset = toLocal(midDay + sunriseH);
  let maghrib: number;
  if (method.maghribAngle !== undefined) {
    maghrib = toLocal(midDay + hourAngle(lat, decl, -method.maghribAngle));
  } else {
    maghrib = sunset + (method.maghribMinutes ?? 0) / 60;
  }
  let isha = method.ishaMinutes !== undefined
    ? maghrib + method.ishaMinutes / 60
    : toLocal(midDay + ishaH);

  const dhuhr = toLocal(midDay) + opts.dhuhrOffsetMinutes / 60;

  // Asr: sun altitude where shadow = juristic factor + tan(|lat - decl|)
  const shadow = opts.asrJuristic === 'hanafi' ? 2 : 1;
  const asrAlt = R2D * Math.atan(1 / (shadow + Math.tan(Math.abs(lat - decl) * D2R)));
  const asr = toLocal(midDay + hourAngle(lat, decl, asrAlt));

  // High-latitude fallback (night-portion method)
  if (Number.isNaN(fajr) || Number.isNaN(isha)) {
    const night = fixHour(sunrise + 24 - sunset); // sunset -> next sunrise
    const portion = opts.highLatitudeRule === 'midnight' ? 0.5
      : opts.highLatitudeRule === 'oneseventh' ? 1 / 7
      : 0; // 'angle' (default): angle/60
    const fajrPortion = portion || method.fajrAngle / 60;
    const ishaPortion = portion || method.ishaAngle / 60;
    if (Number.isNaN(fajr)) fajr = fixHour(sunrise - night * fajrPortion);
    if (Number.isNaN(isha)) isha = fixHour(sunset + night * ishaPortion);
  }

  const adj = (t: number, k: keyof PrayerTimes) =>
    fixHour(t + (opts.adjustments[k] ?? 0) / 60);

  return {
    fajr: adj(fajr, 'fajr'),
    sunrise: adj(sunrise, 'sunrise'),
    dhuhr: adj(dhuhr, 'dhuhr'),
    asr: adj(asr, 'asr'),
    maghrib: adj(maghrib, 'maghrib'),
    isha: adj(isha, 'isha'),
  };
}

/** "05:42" or "5:42 PM" depending on 24h flag. */
export function formatTime(t: number, use24h: boolean): string {  const h24 = Math.floor(t);
  const m = Math.floor((t - h24) * 60);
  const mm = String(m).padStart(2, '0');
  if (use24h) return `${String(h24).padStart(2, '0')}:${mm}`;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${suffix}`;
}

/** Next upcoming prayer name + Date object for today. */
export function nextPrayer(times: PrayerTimes, now: Date): { name: keyof PrayerTimes; at: Date } {
  const order: (keyof PrayerTimes)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const name of order) {
    const at = new Date(now);
    at.setHours(Math.floor(times[name]), Math.floor((times[name] % 1) * 60), 0, 0);
    if (at.getTime() > now.getTime()) return { name, at };
  }
  const at = new Date(now);
  at.setDate(at.getDate() + 1);
  at.setHours(Math.floor(times.fajr), Math.floor((times.fajr % 1) * 60), 0, 0);
  return { name: 'fajr', at };
}

// ---------------------------------------------------------------------------
// Auto method detection (100% offline)
// Picks the standard calculation method for the user's country from GPS
// coordinates using lat/lon bounding boxes. No network, no API.
// ---------------------------------------------------------------------------

interface CountryBox {
  name: string;
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
  methodId: string;
}

// Ordered: specific countries first, regional catch-alls last (first match wins).
const COUNTRY_BOXES: CountryBox[] = [
  // --- South Asia → Karachi (Univ. of Islamic Sciences) ---
  { name: 'Pakistan', minLat: 22, maxLat: 37.2, minLng: 60.8, maxLng: 75.2, methodId: 'karachi' },
  { name: 'Bangladesh', minLat: 20.5, maxLat: 26.7, minLng: 88, maxLng: 92.7, methodId: 'karachi' },
  { name: 'Nepal', minLat: 26.3, maxLat: 30.5, minLng: 80, maxLng: 88.2, methodId: 'karachi' },
  { name: 'Sri Lanka', minLat: 5.9, maxLat: 9.9, minLng: 79.6, maxLng: 81.9, methodId: 'karachi' },
  { name: 'Afghanistan', minLat: 29.3, maxLat: 38.6, minLng: 60.5, maxLng: 75, methodId: 'karachi' },
  { name: 'India', minLat: 6.5, maxLat: 35.6, minLng: 68.1, maxLng: 97.4, methodId: 'karachi' },
  // --- North America → ISNA ---
  { name: 'Canada', minLat: 41.7, maxLat: 72, minLng: -141, maxLng: -52, methodId: 'isna' },
  { name: 'USA', minLat: 24.5, maxLat: 49.4, minLng: -125, maxLng: -66.9, methodId: 'isna' },
  // --- Shia-majority → Jafari (before Iran: small, specific boxes win) ---
  { name: 'Bahrain', minLat: 25.5, maxLat: 26.3, minLng: 50.3, maxLng: 50.7, methodId: 'jafari' },
  // --- Gulf states → Egyptian (before Iraq/Iran: avoids Gulf overlap) ---
  { name: 'Qatar', minLat: 24.4, maxLat: 26.2, minLng: 50.7, maxLng: 51.7, methodId: 'egypt' },
  { name: 'UAE', minLat: 22.6, maxLat: 26.1, minLng: 51.5, maxLng: 56.4, methodId: 'egypt' },
  { name: 'Kuwait', minLat: 28.5, maxLat: 30.1, minLng: 46.5, maxLng: 48.5, methodId: 'egypt' },
  { name: 'Iraq', minLat: 29, maxLat: 37.4, minLng: 38.7, maxLng: 48.6, methodId: 'jafari' },
  // --- Iran → Institute of Geophysics, Tehran ---
  { name: 'Iran', minLat: 25, maxLat: 39.8, minLng: 44, maxLng: 63.4, methodId: 'tehran' },
  // --- Middle East / North Africa → Egyptian General Authority ---
  { name: 'Egypt', minLat: 21.9, maxLat: 31.7, minLng: 24.6, maxLng: 35, methodId: 'egypt' },
  { name: 'Saudi Arabia', minLat: 16, maxLat: 32.2, minLng: 34.6, maxLng: 55.7, methodId: 'egypt' },
  { name: 'Oman', minLat: 16.6, maxLat: 26.6, minLng: 51.9, maxLng: 59.9, methodId: 'egypt' },
  { name: 'Yemen', minLat: 12.5, maxLat: 19, minLng: 42.5, maxLng: 55, methodId: 'egypt' },
  { name: 'Jordan', minLat: 29.1, maxLat: 33.4, minLng: 34.9, maxLng: 39.3, methodId: 'egypt' },
  { name: 'Lebanon', minLat: 33, maxLat: 34.7, minLng: 35, maxLng: 36.7, methodId: 'egypt' },
  { name: 'Syria', minLat: 32, maxLat: 37.3, minLng: 35.7, maxLng: 42.4, methodId: 'egypt' },
  // --- Europe / SE Asia → Muslim World League ---
  { name: 'UK', minLat: 49.8, maxLat: 58.7, minLng: -5.8, maxLng: 1.8, methodId: 'mwl' },
  { name: 'France', minLat: 41.3, maxLat: 51.1, minLng: -5.2, maxLng: 8.3, methodId: 'mwl' },
  { name: 'Germany', minLat: 47.2, maxLat: 55.1, minLng: 5.8, maxLng: 15.1, methodId: 'mwl' },
  { name: 'Turkey', minLat: 35.8, maxLat: 42.2, minLng: 25.6, maxLng: 45, methodId: 'mwl' },
  { name: 'Indonesia', minLat: -11, maxLat: 6.2, minLng: 95, maxLng: 141, methodId: 'mwl' },
  { name: 'Malaysia', minLat: 0.8, maxLat: 7.4, minLng: 99.6, maxLng: 104.6, methodId: 'mwl' },
  // --- Regional catch-alls (last) ---
  { name: 'Europe', minLat: 36, maxLat: 71, minLng: -10, maxLng: 45, methodId: 'mwl' },
  { name: 'Middle East', minLat: 12, maxLat: 42, minLng: 35, maxLng: 60, methodId: 'egypt' },
];

/** Result of offline country/method detection. */
export interface DetectedMethod {
  methodId: string;
  /** Human-readable region name, or null if unknown. */
  country: string | null;
}

/**
 * Detect the standard prayer calculation method for GPS coordinates.
 * 100% offline (bounding boxes). Falls back to Muslim World League.
 */
export function detectMethodForLocation(lat: number, lng: number): DetectedMethod {
  for (const b of COUNTRY_BOXES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return { methodId: b.methodId, country: b.name };
    }
  }
  return { methodId: 'mwl', country: null };
}

/** Full method object for a detected result. */
export function methodForDetection(d: DetectedMethod): PrayerMethod {
  return PRAYER_METHODS.find(m => m.id === d.methodId) ?? PRAYER_METHODS[0];
}
