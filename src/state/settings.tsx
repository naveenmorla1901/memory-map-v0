import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemePreference } from '../theme/ThemeProvider';
import type { DistanceUnit } from '../utils/geo';

export interface Settings {
  theme: ThemePreference;
  units: DistanceUnit;
  /** Master switch for "you're near a saved place" notifications. */
  nearbyAlerts: boolean;
  /** Seen the "save from Instagram" walkthrough. */
  seenShareTips: boolean;
}

const DEFAULTS: Settings = {
  theme: 'system',
  units: defaultUnits(),
  nearbyAlerts: false,
  seenShareTips: false,
};

const STORAGE_KEY = 'mm.settings.v1';

function defaultUnits(): DistanceUnit {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return /-(US|GB|LR|MM)$/i.test(locale) ? 'mi' : 'km';
  } catch {
    return 'km';
  }
}

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  update: (changes: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setSettings({ ...DEFAULTS, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((changes: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
