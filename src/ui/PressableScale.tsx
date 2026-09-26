import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { motion } from '../theme/tokens';
import { haptics } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far to shrink while pressed (0.96 = 4%). */
  scaleTo?: number;
  haptic?: boolean;
}

/** A pressable that springs down slightly under the finger - the app's standard touch feedback. */
export function PressableScale({ style, scaleTo = 0.96, haptic = false, onPressIn, onPressOut, onPress, disabled, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, motion.spring);
        opacity.value = withTiming(0.9, { duration: motion.fast });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, motion.spring);
        opacity.value = withTiming(1, { duration: motion.fast });
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) haptics.tap();
        onPress?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
