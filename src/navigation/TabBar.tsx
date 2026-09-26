import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { motion, spacing } from '../theme/tokens';
import { haptics } from '../ui/haptics';
import { Text } from '../ui/Text';

const ICONS: Record<string, [IconName, IconName]> = {
  Map: ['map', 'map-outline'],
  Places: ['bookmarks', 'bookmarks-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.background, borderTopColor: colors.separator, paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = (descriptors[route.key].options.title ?? route.name) as string;
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            testID={`tab-${route.name}`}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptics.select();
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          >
            <TabIcon name={route.name} focused={focused} />
            <Text variant="micro" style={{ color: focused ? colors.primary : colors.textTertiary }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.9);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 0.94, motion.bouncy);
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const [active, inactive] = ICONS[name] ?? ['ellipse', 'ellipse-outline'];
  return (
    <Animated.View style={style}>
      <Ionicons name={focused ? active : inactive} size={25} color={focused ? colors.primary : colors.textTertiary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
});
