import React, { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { motion, radii, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  /** Adds a show/hide toggle and hides the text by default. */
  password?: boolean;
  multilineHeight?: number;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, password, multilineHeight, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);

  // A small shake when a new error appears draws the eye to the field.
  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, shake]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : interpolateColor(focus.value, [0, 1], [colors.border, colors.primary]),
    transform: [{ translateX: shake.value }],
  }));

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="captionStrong" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.box,
          { backgroundColor: colors.surface },
          multilineHeight ? { minHeight: multilineHeight, alignItems: 'flex-start', paddingVertical: spacing.md } : null,
          boxStyle,
        ]}
      >
        {icon && <Ionicons name={icon} size={19} color={colors.textTertiary} style={styles.icon} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          autoCorrect={password ? false : rest.autoCorrect}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          maxFontSizeMultiplier={1.5}
          {...rest}
          onFocus={(event) => {
            focus.value = withTiming(1, { duration: motion.fast });
            onFocus?.(event);
          }}
          onBlur={(event) => {
            focus.value = withTiming(0, { duration: motion.fast });
            onBlur?.(event);
          }}
          style={[typography.body, styles.input, { color: colors.text }, multilineHeight ? styles.multiline : null, style]}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.fast)} style={styles.messageRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text variant="caption" color="danger" style={styles.message} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" color="textTertiary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { marginLeft: spacing.xxs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.sm },
  multiline: { textAlignVertical: 'top', paddingVertical: 0 },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.xxs },
  message: { flex: 1 },
  hint: { marginLeft: spacing.xxs },
});
