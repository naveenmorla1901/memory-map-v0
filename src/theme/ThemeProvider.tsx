import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { ColorScheme, Colors, palettes } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface Theme {
  scheme: ColorScheme;
  colors: Colors;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({ scheme: 'light', colors: palettes.light, isDark: false });

export function ThemeProvider({ preference = 'system', children }: { preference?: ThemePreference; children: React.ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ scheme, colors: palettes[scheme], isDark: scheme === 'dark' }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Memoized StyleSheet-style factory that re-runs only when the theme changes. */
export function useThemedStyles<T>(factory: (colors: Colors, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors, isDark), [colors, isDark]);
}
