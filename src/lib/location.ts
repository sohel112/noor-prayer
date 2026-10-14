// Location: one GPS fix stored on-device, or manual city entry.
// Nothing is ever uploaded anywhere.

import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getJSON, setJSON } from './storage';

export interface SavedLocation {
  lat: number;
  lng: number;
  label: string;
  source: 'gps' | 'manual';
}

export function useLocation() {
  const [loc, setLoc] = useState<SavedLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJSON<SavedLocation | null>('location', null).then(v => {
      setLoc(v);
      setLoading(false);
    });
  }, []);

  const save = async (l: SavedLocation) => {
    await setJSON('location', l);
    setLoc(l);
  };

  const useGps = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    await save({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      label: [geo?.city, geo?.country].filter(Boolean).join(', ') || 'GPS location',
      source: 'gps',
    });
    return true;
  };

  return { loc, loading, save, useGps };
}
