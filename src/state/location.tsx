import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

import type { Coordinates } from '../utils/geo';

type Permission = 'unknown' | 'granted' | 'denied' | 'blocked';

interface LocationContextValue {
  coords: Coordinates | null;
  permission: Permission;
  /** Ask for permission (or open Settings if it was permanently denied). Resolves to the current position, if any. */
  request: () => Promise<Coordinates | null>;
}

const LocationContext = createContext<LocationContextValue>({
  coords: null,
  permission: 'unknown',
  request: async () => null,
});

const toCoords = (position: Location.LocationObject): Coordinates => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
});

/** One shared, battery-friendly location watcher for the whole app (only while it's in the foreground). */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [permission, setPermission] = useState<Permission>('unknown');
  const watcher = useRef<Location.LocationSubscription | null>(null);

  const startWatching = useCallback(async () => {
    if (watcher.current) return;
    Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })
      .then((last) => last && setCoords((current) => current ?? toCoords(last)))
      .catch(() => {});
    try {
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 15_000 },
        (position) => setCoords(toCoords(position)),
      );
    } catch {
      // Location services off - leave coords as they are.
    }
  }, []);

  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
  }, []);

  const sync = useCallback(async () => {
    const status = await Location.getForegroundPermissionsAsync().catch(() => null);
    if (!status) return;
    const next: Permission = status.granted ? 'granted' : status.canAskAgain ? (status.status === 'undetermined' ? 'unknown' : 'denied') : 'blocked';
    setPermission(next);
    if (status.granted) startWatching();
  }, [startWatching]);

  useEffect(() => {
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
      else stopWatching();
    });
    return () => {
      subscription.remove();
      stopWatching();
    };
  }, [sync, stopWatching]);

  const request = useCallback(async () => {
    const existing = await Location.getForegroundPermissionsAsync();
    if (!existing.granted && !existing.canAskAgain) {
      setPermission('blocked');
      Linking.openSettings();
      return null;
    }
    const result = existing.granted ? existing : await Location.requestForegroundPermissionsAsync();
    if (!result.granted) {
      setPermission(result.canAskAgain ? 'denied' : 'blocked');
      return null;
    }
    setPermission('granted');
    startWatching();
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const current = toCoords(position);
      setCoords(current);
      return current;
    } catch {
      return null;
    }
  }, [startWatching]);

  const value = useMemo(() => ({ coords, permission, request }), [coords, permission, request]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useUserLocation = () => useContext(LocationContext);
