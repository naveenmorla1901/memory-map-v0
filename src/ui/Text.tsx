import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Colors, typography, TypographyVariant } from '../theme/tokens';

type ColorName = 'text' | 'textSecondary' | 'textTertiary' | 'primary' | 'danger' | 'success' | 'onPrimary' | 'warning';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier ?? 1.6}
      style={[typography[variant], { color: colors[color as keyof Colors] }, align && { textAlign: align }, style]}
    />
  );
}
