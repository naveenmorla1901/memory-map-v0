import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategory } from '../theme/categories';
import { useTheme } from '../theme/ThemeProvider';

/** The category's icon in a tinted circle - used in lists, cards and pickers. */
export function CategoryIcon({ category, size = 40, solid = false }: { category: string; size?: number; solid?: boolean }) {
  const { isDark } = useTheme();
  const { icon, color } = getCategory(category);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: solid ? color : `${color}${isDark ? '33' : '1F'}`,
      }}
    >
      <Ionicons name={icon} size={size * 0.48} color={solid ? '#FFFFFF' : color} />
    </View>
  );
}
