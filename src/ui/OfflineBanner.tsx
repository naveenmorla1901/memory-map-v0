import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';
import { Text } from './Text';

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        // isInternetReachable is null while unknown - don't flash the banner then.
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );
  return offline;
}

/** A small pill under the status bar while there's no connection. */
export function OfflineBanner() {
  const offline = useIsOffline();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!offline) return null;
  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="none"
      style={[styles.banner, { top: insets.top + spacing.xs, backgroundColor: colors.text }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel="You're offline. Showing your saved places from this device."
    >
      <Ionicons name="cloud-offline-outline" size={15} color={colors.background} />
      <Text variant="captionStrong" style={{ color: colors.background }}>
        Offline - showing saved copy
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    zIndex: 100,
  },
});
