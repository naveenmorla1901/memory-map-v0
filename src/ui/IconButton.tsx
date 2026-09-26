import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { elevation } from '../theme/tokens';
import { PressableScale } from './PressableScale';

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  /** 'plain' has no background; 'filled' is a soft circle; 'floating' is a shadowed circle for use over the map. */
  appearance?: 'plain' | 'filled' | 'floating';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({ icon, onPress, accessibilityLabel, size = 22, color, appearance = 'plain', disabled, style, testID }: IconButtonProps) {
  const { colors } = useTheme();
  const diameter = size + (appearance === 'floating' ? 24 : 18);
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.9}
      haptic={appearance === 'floating'}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        appearance === 'filled' && { backgroundColor: colors.surface },
        appearance === 'floating' && { backgroundColor: colors.surfaceElevated, ...elevation(colors, 2) },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color ?? colors.text} />
    </PressableScale>
  );
}
