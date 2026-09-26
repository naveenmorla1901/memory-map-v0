import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';
import { Text } from '../../ui/Text';

export function PendingShareNotice() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown} style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
      <Ionicons name="logo-instagram" size={20} color={colors.primary} />
      <Text variant="callout" style={styles.text}>
        Sign in and we'll find the places in the reel you shared.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md },
  text: { flex: 1 },
});
