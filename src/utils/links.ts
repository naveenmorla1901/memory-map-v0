import { Linking, Platform, Share } from 'react-native';

interface Target {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/** A link anyone can open, on any phone or computer. */
export function mapsLink({ latitude, longitude }: Target): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Hand off to the phone's maps app for directions. */
export async function openDirections(target: Target): Promise<void> {
  const { latitude, longitude, name } = target;
  const label = encodeURIComponent(name);
  const native = Platform.select({
    ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
  });
  try {
    if (native) {
      await Linking.openURL(native);
      return;
    }
  } catch {
    // No maps app handled it - fall back to the web.
  }
  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
}

export function sharePlace(target: Target) {
  const lines = [target.name, target.address, mapsLink(target)].filter(Boolean);
  return Share.share({ message: lines.join('\n'), title: target.name });
}
