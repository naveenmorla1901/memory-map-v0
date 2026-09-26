import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

export function Skeleton({ width, height, radius = radii.sm, style }: { width: DimensionValue; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton }, animated, style]} />;
}

/** Placeholder rows shaped like the places list while it first loads. */
export function PlaceRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading places" accessible>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={styles.text}>
            <Skeleton width={`${55 + ((index * 17) % 35)}%`} height={16} />
            <Skeleton width={`${35 + ((index * 23) % 30)}%`} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  text: { flex: 1, gap: spacing.sm },
});
