export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type DistanceUnit = 'km' | 'mi';

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometers. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "350 m", "1.2 km", "48 km", "0.3 mi", "12 mi". */
export function formatDistance(km: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'mi') {
    const miles = km * 0.621371;
    if (miles < 0.1) return `${Math.max(10, Math.round((miles * 5280) / 10) * 10)} ft`;
    return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles).toLocaleString()} mi`;
  }
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString()} km`;
}

/** A radius setting, e.g. 0.5 -> "500 m" / "0.3 mi". */
export function formatRadius(km: number, unit: DistanceUnit = 'km'): string {
  return formatDistance(km, unit);
}

/** [west, south, east, north] around a set of points, padded so edge pins aren't cut off. */
export function boundsOf(points: Coordinates[]): [number, number, number, number] | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const { latitude, longitude } of points) {
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  }
  const padLon = Math.max((east - west) * 0.1, 0.01);
  const padLat = Math.max((north - south) * 0.1, 0.01);
  return [west - padLon, south - padLat, east + padLon, north + padLat];
}

/**
 * The useful part of an address to show under a name: the street or
 * neighborhood and the city, without the state and country that every
 * place in the same city shares.
 *   "600 Guerrero St, Mission District, San Francisco, California, United States" -> "Mission District, San Francisco"
 *   "San Francisco, California, United States" -> "San Francisco, California"
 */
export function shortAddress(address: string): string {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 4) return parts.slice(0, -2).slice(-2).join(', ');
  if (parts.length === 3) return parts.slice(0, 2).join(', ');
  return parts.join(', ');
}

/**
 * Where to bias place search: the phone's location, or - without location
 * permission - the middle of the user's saved places (the median, so one
 * far-away trip doesn't drag it into the ocean).
 */
export function searchBias(current: Coordinates | null, saved: Coordinates[]): Coordinates | null {
  if (current) return current;
  if (saved.length === 0) return null;
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  return { latitude: median(saved.map((p) => p.latitude)), longitude: median(saved.map((p) => p.longitude)) };
}
