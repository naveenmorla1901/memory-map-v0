import { Platform } from 'react-native';

export const typography = {
  // Simplified fonts using only default system fonts
  fonts: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto',
      bold: 'Roboto',
    },
  }),
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  // Using weights instead of different font families
  weights: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  // Line heights
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
  },
};