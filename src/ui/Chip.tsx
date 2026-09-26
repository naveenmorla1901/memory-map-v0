import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { elevation, radii, spacing } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Accent for the icon and the selected state (defaults to the brand color). */
  color?: string;
  /** Adds a shadow so the chip reads on top of the map. */
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, onPress, icon, color, floating, style }: ChipProps) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : floating ? colors.surfaceElevated : colors.surface,
          borderColor: selected ? accent : floating ? colors.surfaceElevated : colors.border,
        },
        floating && elevation(colors, 1),
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={15} color={selected ? '#FFFFFF' : accent} />}
      <Text variant="captionStrong" style={{ color: selected ? '#FFFFFF' : colors.text }} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
