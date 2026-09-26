import { useEffect, useMemo, useRef } from 'react';

import { useUserLocation } from '../state/location';
import { usePlaces } from '../state/places';
import { useSettings } from '../state/settings';
import { syncNearbyAlerts } from './nearby';

/** Keeps the OS geofences in step with the places and the nearby-alerts setting. Renders nothing. */
export function NearbyManager() {
  const { places, status } = usePlaces();
  const { settings, loaded } = useSettings();
  const { coords } = useUserLocation();

  // Only re-sync when something that affects the regions changes, and only
  // re-rank by distance after moving a meaningful amount (~5 km).
  const signature = useMemo(
    () => places.filter((place) => place.notify_enabled).map((place) => `${place.id}:${place.notify_radius_km}:${place.latitude},${place.longitude}`).join('|'),
    [places],
  );
  const coarse = coords ? `${coords.latitude.toFixed(1)},${coords.longitude.toFixed(1)}` : '';
  const latest = useRef({ places, coords });
  latest.current = { places, coords };

  useEffect(() => {
    if (!loaded || status !== 'ready') return;
    const timer = setTimeout(() => {
      syncNearbyAlerts(latest.current.places, settings.nearbyAlerts, latest.current.coords).catch((error) =>
        console.warn('Syncing nearby alerts failed', error),
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [signature, coarse, settings.nearbyAlerts, loaded, status]);

  return null;
}
