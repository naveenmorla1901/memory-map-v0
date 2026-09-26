import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { elevation, radii, spacing } from '../theme/tokens';
import { haptics } from './haptics';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  kind?: ToastKind;
  action?: { label: string; onPress: () => void };
  durationMs?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

const ICONS: Record<ToastKind, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle-outline',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    const kind = options.kind ?? 'info';
    if (kind === 'success') haptics.success();
    if (kind === 'error') haptics.error();
    AccessibilityInfo.announceForAccessibility(options.message);
    setToast({ ...options, kind, id: nextId.current++ });
    timer.current = setTimeout(() => setToast(null), options.durationMs ?? (options.action ? 5000 : 3000));
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastHost toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

function ToastHost({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  const content = <ToastView toast={toast} onDismiss={onDismiss} />;
  // On iOS a toast in the root view would sit *under* natively presented
  // modals; FullWindowOverlay puts it in its own window above everything.
  return Platform.OS === 'ios' ? <FullWindowOverlay>{content}</FullWindowOverlay> : content;
}

function ToastView({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tint = useMemo(
    () => ({ success: colors.success, error: colors.danger, info: colors.primary }),
    [colors],
  );

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + spacing.sm }]}>
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.springify().damping(16)}
          exiting={FadeOutUp.duration(180)}
          layout={LinearTransition}
          style={[styles.toast, { backgroundColor: isDark ? colors.surfaceElevated : '#1C1C21' }, elevation(colors, 3)]}
          accessibilityRole="alert"
        >
          <Pressable style={styles.body} onPress={onDismiss} accessibilityLabel={`${toast.message}. Dismiss`}>
            <Ionicons name={ICONS[toast.kind ?? 'info']} size={20} color={tint[toast.kind ?? 'info']} />
            <Text variant="callout" style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </Pressable>
          {toast.action && (
            <Pressable
              hitSlop={8}
              style={styles.action}
              accessibilityRole="button"
              onPress={() => {
                toast.action?.onPress();
                onDismiss();
              }}
            >
              <Text variant="bodyStrong" style={{ color: colors.primary }}>
                {toast.action.label}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    minHeight: 52,
    alignSelf: 'center',
    maxWidth: 560,
    width: '92%',
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  message: { flex: 1, color: '#FFFFFF' },
  action: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
