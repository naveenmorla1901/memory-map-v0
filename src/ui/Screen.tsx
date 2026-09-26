import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (forms, settings). */
  scroll?: boolean;
  /** Push content up with the keyboard. */
  keyboard?: boolean;
  padded?: boolean;
  edges?: Edge[];
  background?: 'background' | 'surface';
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
}

export function Screen({ children, scroll, keyboard, padded = true, edges = ['top', 'bottom'], background = 'background', contentStyle, footer }: ScreenProps) {
  const { colors } = useTheme();
  const padding = padded ? { paddingHorizontal: spacing.xl } : null;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors[background] }]}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
          {footer}
        </KeyboardAvoidingView>
      ) : (
        <>
          {body}
          {footer}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxxl },
});
