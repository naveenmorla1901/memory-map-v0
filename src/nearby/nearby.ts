import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import type { Place } from '../api/types';
import { Coordinates, distanceKm } from '../utils/geo';

/**
 * "You're near a saved place" alerts, using OS geofencing: the phone wakes
 * this task when you enter a place's radius, even if the app is closed.
 * Everything happens on the device - no location is sent to the server.
 */
export const NEARBY_TASK = 'memory-map-nearby';
export const NEARBY_CHANNEL = 'nearby';

const REGION_NAMES_KEY = 'mm.nearby.names.v1';
const LAST_ALERT_KEY = 'mm.nearby.lastAlert.v1';
// iOS monitors at most 20 regions per app; Android 100.
const MAX_REGIONS = Platform.OS === 'ios' ? 20 : 90;
// Don't repeat an alert for the same place within this window.
const COOLDOWN_MS = 12 * 60 * 60 * 1000;
const MIN_RADIUS_M = 150;

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

interface GeofenceEvent {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}

if (supported && !TaskManager.isTaskDefined(NEARBY_TASK)) {
  TaskManager.defineTask<GeofenceEvent>(NEARBY_TASK, async ({ data, error }) => {
    if (error || !data || data.eventType !== Location.GeofencingEventType.Enter || !data.region.identifier) return;
    const placeId = data.region.identifier;
    try {
      const names: Record<string, string> = JSON.parse((await AsyncStorage.getItem(REGION_NAMES_KEY)) ?? '{}');
      const name = names[placeId];
      if (!name) return;

      const lastAlerts: Record<string, number> = JSON.parse((await AsyncStorage.getItem(LAST_ALERT_KEY)) ?? '{}');
      if (Date.now() - (lastAlerts[placeId] ?? 0) < COOLDOWN_MS) return;
      lastAlerts[placeId] = Date.now();
      await AsyncStorage.setItem(LAST_ALERT_KEY, JSON.stringify(lastAlerts));

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `You're near ${name}`,
          body: 'A place you saved is close by. Tap to see it.',
          data: { placeId },
          sound: 'default',
        },
        trigger: Platform.OS === 'android' ? { channelId: NEARBY_CHANNEL } : null,
      });
    } catch (err) {
      console.warn('Nearby alert failed', err);
    }
  });
}

export async function setUpNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NEARBY_CHANNEL, {
    name: 'Nearby places',
    description: "When you're close to a place you saved",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export type EnableResult = { ok: true } | { ok: false; message: string };

/** Walk through the permissions nearby alerts need: location (always) and notifications. */
export async function enableNearbyAlerts(): Promise<EnableResult> {
  if (!supported) return { ok: false, message: 'Nearby alerts need the iOS or Android app.' };
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    return { ok: false, message: 'Nearby alerts need location access. You can allow it in Settings.' };
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    return {
      ok: false,
      message:
        Platform.OS === 'ios'
          ? 'Set location access to "Always" in Settings so alerts work while the app is closed.'
          : 'Set location access to "Allow all the time" in Settings so alerts work while the app is closed.',
    };
  }
  await setUpNotificationChannel();
  const notifications = await Notifications.requestPermissionsAsync();
  if (!notifications.granted) {
    return { ok: false, message: 'Turn on notifications for Memory Map in Settings to get nearby alerts.' };
  }
  return { ok: true };
}

export async function stopNearbyAlerts(): Promise<void> {
  if (!supported) return;
  try {
    if (await Location.hasStartedGeofencingAsync(NEARBY_TASK)) await Location.stopGeofencingAsync(NEARBY_TASK);
  } catch {
    // Not running.
  }
  await AsyncStorage.removeItem(REGION_NAMES_KEY).catch(() => {});
}

/** The places to watch: alert-enabled ones, nearest first, within the OS limit. */
export function pickRegions(places: Place[], near: Coordinates | null, limit = MAX_REGIONS): Place[] {
  const watched = places.filter((place) => place.notify_enabled);
  if (near) watched.sort((a, b) => distanceKm(near, a) - distanceKm(near, b));
  return watched.slice(0, limit);
}

/** Point the OS at the current set of places (call whenever places or the setting change). */
export async function syncNearbyAlerts(places: Place[], enabled: boolean, near: Coordinates | null): Promise<void> {
  if (!supported) return;
  const regions = enabled ? pickRegions(places, near) : [];
  if (regions.length === 0) {
    await stopNearbyAlerts();
    return;
  }
  const background = await Location.getBackgroundPermissionsAsync().catch(() => null);
  if (!background?.granted) {
    await stopNearbyAlerts();
    return;
  }
  await AsyncStorage.setItem(REGION_NAMES_KEY, JSON.stringify(Object.fromEntries(regions.map((place) => [place.id, place.name]))));
  await Location.startGeofencingAsync(
    NEARBY_TASK,
    regions.map((place) => ({
      identifier: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
      radius: Math.max(MIN_RADIUS_M, place.notify_radius_km * 1000),
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}
