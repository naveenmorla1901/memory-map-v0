import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { spacing } from '../theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface HeaderProps {
  title?: string;
  /** 'back' (chevron) or 'close' (x, for modals). */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  trailing?: React.ReactNode;
}

export function Header({ title, leading = 'back', onLeadingPress, trailing }: HeaderProps) {
  const navigation = useNavigation();
  const goBack = onLeadingPress ?? (() => navigation.canGoBack() && navigation.goBack());
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {leading !== 'none' && (
          <IconButton
            icon={leading === 'close' ? 'close' : 'chevron-back'}
            size={24}
            appearance="filled"
            onPress={goBack}
            accessibilityLabel={leading === 'close' ? 'Close' : 'Back'}
          />
        )}
      </View>
      <Text variant="subheading" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: 56 },
  side: { width: 72, flexDirection: 'row' },
  trailing: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
});
