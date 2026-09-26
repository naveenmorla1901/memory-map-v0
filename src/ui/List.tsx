import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import { IconName } from '../theme/categories';
import { radii, spacing } from '../theme/tokens';
import { haptics } from './haptics';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** A titled group of rows in a rounded card, iOS-settings style. */
export function Section({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {title && (
        <Text variant="micro" color="textTertiary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 && <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
            {row}
          </View>
        ))}
      </View>
      {footer && (
        <Text variant="caption" color="textTertiary" style={styles.sectionFooter}>
          {footer}
        </Text>
      )}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Show a switch instead of a chevron. */
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  trailing?: React.ReactNode;
  chevron?: boolean;
  testID?: string;
}

export function Row({ title, subtitle, icon, iconColor, value, onPress, destructive, toggle, trailing, chevron = !!onPress, testID }: RowProps) {
  const { colors } = useTheme();
  const tint = destructive ? colors.danger : iconColor ?? colors.primary;

  const content = (
    <>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: `${tint}1F` }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="callout" color="textTertiary" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}
      {trailing}
      {toggle && (
        <Switch
          value={toggle.value}
          disabled={toggle.disabled}
          onValueChange={(next) => {
            haptics.select();
            toggle.onChange(next);
          }}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
          accessibilityLabel={title}
        />
      )}
      {chevron && !toggle && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
    </>
  );

  if (!onPress || toggle) {
    return (
      <View testID={testID} style={styles.row} accessible={!toggle} accessibilityLabel={toggle ? undefined : [title, subtitle, value].filter(Boolean).join(', ')}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale testID={testID} onPress={onPress} scaleTo={0.98} style={styles.row} accessibilityLabel={[title, value].filter(Boolean).join(', ')}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.lg },
  sectionFooter: { marginHorizontal: spacing.lg },
  card: { borderRadius: radii.lg, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  rowIcon: { width: 32, height: 32, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
});
