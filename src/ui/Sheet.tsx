import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { motion, radii, spacing } from '../theme/tokens';
import { Text } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * A bottom sheet: slides up over a dimmed backdrop, closes on backdrop tap,
 * back button, or dragging it down.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = height;
      translateY.value = withSpring(0, motion.spring);
      backdrop.value = withTiming(1, { duration: motion.normal });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: motion.fast });
      translateY.value = withTiming(height, { duration: motion.normal, easing: Easing.in(Easing.quad) });
      // Unmount on a timer rather than the animation's completion callback,
      // which doesn't fire if the animation is interrupted - that would leave
      // an invisible backdrop swallowing every tap.
      const timer = setTimeout(() => setMounted(false), motion.normal);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 900) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, motion.spring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdropStyle]}>
          <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.surfaceElevated, paddingBottom: insets.bottom + spacing.lg }, sheetStyle]}
          accessibilityViewIsModal
        >
          <GestureDetector gesture={pan}>
            <View style={styles.grabArea}>
              <View style={[styles.grabber, { backgroundColor: colors.border }]} />
              {title && (
                <Text variant="subheading" align="center" accessibilityRole="header">
                  {title}
                </Text>
              )}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
  },
  grabArea: { paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
});
