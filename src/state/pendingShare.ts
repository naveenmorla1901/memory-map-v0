import { useSyncExternalStore } from 'react';

/**
 * A reel link that arrived while nobody was signed in. The signed-in
 * navigator opens it right after sign-in.
 */
let pending: string | null = null;
const listeners = new Set<() => void>();

export const pendingShare = {
  set(url: string | null) {
    pending = url;
    listeners.forEach((listener) => listener());
  },
  take(): string | null {
    const url = pending;
    if (url) pendingShare.set(null);
    return url;
  },
};

export function usePendingShare(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
  );
}
