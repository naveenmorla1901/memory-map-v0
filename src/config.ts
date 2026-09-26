import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * The backend's root URL, e.g. https://api.memorymap.app. Set
 * EXPO_PUBLIC_API_URL in .env (development) or in your EAS build profile.
 *
 * Development defaults: the Android emulator reaches your computer at
 * 10.0.2.2; the iOS simulator at localhost. A physical phone needs your
 * computer's LAN IP, e.g. http://192.168.1.20:8002.
 */
const DEV_DEFAULT = Platform.OS === 'android' ? 'http://10.0.2.2:8002' : 'http://localhost:8002';

export const SERVER_URL = (process.env.EXPO_PUBLIC_API_URL || DEV_DEFAULT).replace(/\/+$/, '').replace(/\/api\/v1$/, '');
export const API_URL = `${SERVER_URL}/api/v1`;

export const LINKS = {
  privacy: `${SERVER_URL}/privacy/`,
  terms: `${SERVER_URL}/terms/`,
  deleteAccount: `${SERVER_URL}/delete-account/`,
  support: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '',
};

/**
 * Shared between the app and its iOS share extension so the extension can
 * use the signed-in session ("group." + the bundle identifier; set in
 * app.config.ts).
 */
export const IOS_APP_GROUP: string = Constants.expoConfig?.extra?.iosAppGroup ?? 'group.com.memorymap.app';

/** Deep link scheme (app.config.ts `scheme`). */
export const URL_SCHEME = 'memorymap';

/** OpenFreeMap: free OpenStreetMap vector tiles, no API key. */
export const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};
export const MAP_FONTS = { regular: ['Noto Sans Regular'], bold: ['Noto Sans Bold'] };
