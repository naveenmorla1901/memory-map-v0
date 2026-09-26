import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { motion, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void; icon?: IconName };
  secondaryAction?: { title: string; onPress: () => void };
  compact?: boolean;
}

export function EmptyState({ icon, title, message, action, secondaryAction, compact }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).duration(motion.normal)} style={styles.text}>
        <Text variant="heading" align="center">
          {title}
        </Text>
        {message && (
          <Text variant="callout" color="textSecondary" align="center">
            {message}
          </Text>
        )}
      </Animated.View>
      {(action || secondaryAction) && (
        <Animated.View entering={FadeInDown.delay(160).duration(motion.normal)} style={styles.actions}>
          {action && <Button title={action.title} icon={action.icon} onPress={action.onPress} size="md" />}
          {secondaryAction && <Button title={secondaryAction.title} variant="ghost" size="md" onPress={secondaryAction.onPress} />}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.lg },
  compact: { flex: 0, paddingVertical: spacing.xxl },
  iconCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  text: { gap: spacing.sm, maxWidth: 320 },
  actions: { alignSelf: 'stretch', gap: spacing.xs, maxWidth: 320, width: '100%', alignItems: 'stretch' },
});
