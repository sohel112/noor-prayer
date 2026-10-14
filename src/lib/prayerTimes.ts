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
export function formatTime(t: number, use24h: boolean): string {
  const h24 = Math.floor(t);
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
