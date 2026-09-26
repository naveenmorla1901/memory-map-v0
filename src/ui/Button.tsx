import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { radii, spacing } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

const HEIGHTS: Record<Size, number> = { lg: 54, md: 46, sm: 36 };

export function Button({ title, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, style, accessibilityHint, testID }: ButtonProps) {
  const { colors } = useTheme();
  const palette = {
    primary: { background: colors.primary, foreground: colors.onPrimary },
    secondary: { background: colors.surface, foreground: colors.text },
    ghost: { background: 'transparent', foreground: colors.primary },
    danger: { background: colors.danger, foreground: '#FFFFFF' },
    dangerSoft: { background: colors.dangerSoft, foreground: colors.danger },
  }[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      haptic={variant !== 'ghost'}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: !!loading, disabled: !!inactive }}
      style={[
        styles.base,
        {
          height: HEIGHTS[size],
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          borderRadius: size === 'sm' ? radii.pill : radii.md,
          backgroundColor: palette.background,
          opacity: disabled && !loading ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={palette.foreground} />}
          <Text variant={size === 'sm' ? 'captionStrong' : 'bodyStrong'} style={{ color: palette.foreground }} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
