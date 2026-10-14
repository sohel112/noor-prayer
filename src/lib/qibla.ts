// Qibla math — great-circle bearing + distance from any point to the Kaaba.
// Pure on-device computation; pair with expo-sensors Magnetometer for the compass.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export const KAABA = { lat: 21.4225, lng: 39.8262 };

/** Bearing in degrees clockwise from true north (0-360). */
export function qiblaBearing(lat: number, lng: number): number {
  const dLng = (KAABA.lng - lng) * D2R;
  const lat1 = lat * D2R;
  const lat2 = KAABA.lat * D2R;
  const y = Math.sin(dLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLng);
  return (R2D * Math.atan2(y, x) + 360) % 360;
}

/** Great-circle distance in kilometres. */
export function qiblaDistanceKm(lat: number, lng: number): number {
  const R = 6371;
  const dLat = (KAABA.lat - lat) * D2R;
  const dLng = (KAABA.lng - lng) * D2R;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat * D2R) * Math.cos(KAABA.lat * D2R) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
