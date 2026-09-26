import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '../api/client';
import { authApi } from '../api/endpoints';
import { sessionStore } from '../api/session';
import type { User } from '../api/types';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue>({ status: 'loading', user: null });

/**
 * Tracks whether someone is signed in. Sign-in/out itself goes through
 * authApi, which writes the session store; this just follows the store.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    const unsubscribe = sessionStore.subscribe((session) => {
      if (active) setState(session ? { status: 'signedIn', user: session.user } : { status: 'signedOut', user: null });
    });

    sessionStore.load().then((session) => {
      if (!active) return;
      setState(session ? { status: 'signedIn', user: session.user } : { status: 'signedOut', user: null });
      // Refresh the profile in the background. A revoked session surfaces as
      // a 401 here and the store clears itself; offline is fine.
      if (session) authApi.me().catch((error) => {
        if (!(error instanceof ApiError)) console.warn('Profile refresh failed', error);
      });
    });

    // The iOS share extension may have signed in/refreshed while we were in
    // the background - pick up its session when we come back.
    const appState = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const before = sessionStore.get();
      sessionStore.load().then((after) => {
        if (!active) return;
        if (!!before !== !!after || before?.user.id !== after?.user.id) {
          setState(after ? { status: 'signedIn', user: after.user } : { status: 'signedOut', user: null });
        }
      });
    });

    return () => {
      active = false;
      unsubscribe();
      appState.remove();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
