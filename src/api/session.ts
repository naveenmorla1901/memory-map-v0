import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { IOS_APP_GROUP } from '../config';
import type { User } from './types';

export interface Session {
  access: string;
  refresh: string;
  user: User;
}

const KEY = 'mm.session';

/**
 * On iOS the session lives in a keychain group shared with the share
 * extension, so saving a reel from Instagram works without opening the app.
 * App groups double as keychain access groups, so no extra entitlement is
 * needed. Builds without the entitlement (e.g. a simulator dev build) fall
 * back to the app's own keychain.
 */
const SHARED: SecureStore.SecureStoreOptions = {
  accessGroup: IOS_APP_GROUP,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};
const LOCAL: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

const webStorage = () => (typeof localStorage === 'undefined' ? null : localStorage);

async function getItem(): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage()?.getItem(KEY) ?? null;
  if (Platform.OS === 'ios') {
    try {
      const shared = await SecureStore.getItemAsync(KEY, SHARED);
      if (shared) return shared;
    } catch {
      // No shared keychain entitlement in this build.
    }
  }
  return SecureStore.getItemAsync(KEY, LOCAL);
}

async function setItem(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.setItem(KEY, value);
    return;
  }
  if (Platform.OS === 'ios') {
    try {
      await SecureStore.setItemAsync(KEY, value, SHARED);
      return;
    } catch {
      // Fall through to the app's own keychain.
    }
  }
  await SecureStore.setItemAsync(KEY, value, LOCAL);
}

async function deleteItem(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(KEY);
    return;
  }
  await Promise.allSettled([
    Platform.OS === 'ios' ? SecureStore.deleteItemAsync(KEY, SHARED) : Promise.resolve(),
    SecureStore.deleteItemAsync(KEY, LOCAL),
  ]);
}

type Listener = (session: Session | null) => void;

let current: Session | null | undefined; // undefined = not loaded yet
const listeners = new Set<Listener>();

export const sessionStore = {
  /** The stored session, read fresh from storage (another process may have refreshed it). */
  async load(): Promise<Session | null> {
    try {
      const raw = await getItem();
      current = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      current = null;
    }
    return current;
  },

  get(): Session | null {
    return current ?? null;
  },

  async set(session: Session): Promise<void> {
    current = session;
    await setItem(JSON.stringify(session));
    listeners.forEach((listener) => listener(session));
  },

  async update(patch: Partial<Session>): Promise<void> {
    if (!current) return;
    await sessionStore.set({ ...current, ...patch });
  },

  async clear(): Promise<void> {
    const hadSession = current !== null;
    current = null;
    await deleteItem();
    if (hadSession) listeners.forEach((listener) => listener(null));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
