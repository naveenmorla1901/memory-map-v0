import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES, CategoryKey } from '../theme/categories';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';
import { haptics } from '../ui/haptics';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';

export function CategoryPicker({ value, onChange }: { value: CategoryKey; onChange: (value: CategoryKey) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Category">
      {CATEGORIES.map((category) => {
        const selected = category.key === value;
        return (
          <PressableScale
            key={category.key}
            onPress={() => {
              haptics.select();
              onChange(category.key);
            }}
            scaleTo={0.92}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={category.label}
            style={[
              styles.tile,
              {
                backgroundColor: selected ? `${category.color}1F` : colors.surface,
                borderColor: selected ? category.color : 'transparent',
              },
            ]}
          >
            <Ionicons name={category.icon} size={22} color={category.color} />
            <Text variant="caption" numberOfLines={1} style={{ color: selected ? category.color : colors.textSecondary, fontWeight: selected ? '700' : '500' }}>
              {category.label.replace(' & nightlife', '')}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
});
