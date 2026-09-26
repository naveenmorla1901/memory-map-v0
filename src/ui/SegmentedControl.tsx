import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { elevation, motion, radii, spacing } from '../theme/tokens';
import { haptics } from './haptics';
import { Text } from './Text';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const segmentWidth = width / options.length;
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  const indicator = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: withSpring(index * segmentWidth, motion.spring) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width - 4)}
      style={[styles.track, { backgroundColor: colors.surfacePressed }]}
    >
      {width > 0 && <Animated.View style={[styles.indicator, { backgroundColor: colors.surfaceElevated }, elevation(colors, 1), indicator]} />}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptics.select();
                onChange(option.value);
              }
            }}
          >
            <Text variant="captionStrong" color={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radii.md, padding: 2, height: 38 },
  indicator: { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: radii.md - 2 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
});
