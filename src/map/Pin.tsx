import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getCategory, IconName } from '../theme/categories';
import { motion } from '../theme/tokens';

interface PinProps {
  category?: string;
  /** Overrides the category's color/icon (e.g. the dropped-pin marker). */
  color?: string;
  icon?: IconName;
  /** A soft ripple under the pin - used for a dropped pin waiting to be saved. */
  pulse?: boolean;
}

/** A teardrop pin that drops in with a bounce. Anchored at its tip (anchor "bottom"). */
export function Pin({ category, color, icon, pulse }: PinProps) {
  const meta = getCategory(category);
  const tint = color ?? meta.color;
  const drop = useSharedValue(-40);
  const scale = useSharedValue(0.4);
  const ripple = useSharedValue(0);

  useEffect(() => {
    drop.value = withSpring(0, motion.bouncy);
    scale.value = withSpring(1, motion.bouncy);
    if (pulse) {
      ripple.value = withDelay(300, withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
    }
  }, [drop, scale, ripple, pulse]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value }, { scale: scale.value }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 0.08 + (1 - Math.min(1, Math.abs(drop.value) / 40)) * 0.14 }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.value),
    transform: [{ scale: 0.4 + ripple.value * 1.8 }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {pulse && <Animated.View style={[styles.ripple, { backgroundColor: tint }, rippleStyle]} />}
      <Animated.View style={[styles.shadow, shadowStyle]} />
      <Animated.View style={[styles.pin, pinStyle]}>
        <View style={[styles.head, { backgroundColor: tint }]}>
          <Ionicons name={icon ?? meta.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={[styles.tip, { borderTopColor: tint }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 64, height: 64, alignItems: 'center', justifyContent: 'flex-end' },
  pin: { alignItems: 'center' },
  head: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  shadow: { position: 'absolute', bottom: -2, width: 12, height: 4, borderRadius: 6, backgroundColor: '#000' },
  ripple: { position: 'absolute', bottom: -18, width: 40, height: 40, borderRadius: 20 },
});
