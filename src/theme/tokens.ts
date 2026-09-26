import { Platform, TextStyle, ViewStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

const brand = {
  primary: '#FF4B55',
  primaryPressed: '#E53D47',
};

export const palettes = {
  light: {
    ...brand,
    primarySoft: '#FFE9EA',
    onPrimary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F5F5F7',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#ECECF0',
    text: '#111114',
    textSecondary: '#5C5C68',
    textTertiary: '#9898A3',
    border: '#E4E4EA',
    separator: '#EEEEF2',
    success: '#16A05A',
    successSoft: '#E3F6EC',
    warning: '#C98300',
    danger: '#D93636',
    dangerSoft: '#FDEAEA',
    star: '#F5A524',
    backdrop: 'rgba(12, 12, 16, 0.45)',
    shadow: '#000000',
    skeleton: '#EDEDF1',
  },
  dark: {
    primary: '#FF5A63',
    primaryPressed: '#FF7A81',
    primarySoft: '#3A1D20',
    onPrimary: '#FFFFFF',
    background: '#0D0D10',
    surface: '#1A1A1F',
    surfaceElevated: '#222228',
    surfacePressed: '#2A2A31',
    text: '#F4F4F6',
    textSecondary: '#A9A9B4',
    textTertiary: '#6F6F7A',
    border: '#2E2E36',
    separator: '#24242A',
    success: '#35C27A',
    successSoft: '#12301F',
    warning: '#E0A21E',
    danger: '#FF5C5C',
    dangerSoft: '#3A1818',
    star: '#F5B53D',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
    skeleton: '#26262D',
  },
};

export type Colors = typeof palettes.light;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };

export const radii = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

const fontFamily = Platform.select({ ios: 'System', default: undefined });

export const typography = {
  hero: { fontFamily, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontFamily, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontFamily, fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  callout: { fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  micro: { fontFamily, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.3 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export function elevation(colors: Colors, level: 1 | 2 | 3 = 1): ViewStyle {
  const values = { 1: [2, 6, 0.08, 2], 2: [6, 16, 0.12, 6], 3: [12, 28, 0.18, 12] }[level];
  return {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: values[0] },
    shadowRadius: values[1],
    shadowOpacity: values[2],
    elevation: values[3],
  };
}

/** Durations/springs shared by every animation, so motion feels consistent. */
export const motion = {
  fast: 160,
  normal: 240,
  slow: 380,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  bouncy: { damping: 11, stiffness: 180, mass: 0.8 },
};
