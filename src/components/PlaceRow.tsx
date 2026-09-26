import React, { memo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import type { Place } from '../api/types';
import { getCategory } from '../theme/categories';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { CategoryIcon } from '../ui/CategoryIcon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';
import { shortAddress } from '../utils/geo';

interface PlaceRowProps {
  place: Place;
  distance: string | null;
  onPress: (place: Place) => void;
  onToggleVisited: (place: Place) => void;
  onDelete: (place: Place) => void;
}

/** A saved place in the list. Swipe right to mark visited, left to delete. */
export const PlaceRow = memo(function PlaceRow({ place, distance, onPress, onToggleVisited, onDelete }: PlaceRowProps) {
  const { colors } = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);
  const category = getCategory(place.category);
  const subtitle = [category.label, place.address ? shortAddress(place.address) : null].filter(Boolean).join(' · ');

  return (
    <Swipeable
      ref={swipeable}
      friction={1.6}
      leftThreshold={70}
      rightThreshold={70}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={(progress) => (
        <SwipeAction
          progress={progress}
          color={colors.success}
          icon={place.visited ? 'close-circle' : 'checkmark-circle'}
          label={place.visited ? 'Not visited' : 'Visited'}
          align="left"
        />
      )}
      renderRightActions={(progress) => <SwipeAction progress={progress} color={colors.danger} icon="trash-outline" label="Delete" align="right" />}
      onSwipeableOpen={(direction) => {
        // 'left' = the row slid left, revealing the right-hand (delete) action.
        if (direction === 'left') {
          onDelete(place);
        } else {
          onToggleVisited(place);
          swipeable.current?.close();
        }
      }}
      containerStyle={{ backgroundColor: colors.background }}
    >
      <PressableScale
        onPress={() => onPress(place)}
        scaleTo={0.985}
        style={[styles.row, { backgroundColor: colors.background }]}
        accessibilityLabel={[place.name, subtitle, distance, place.is_favorite ? 'Favorite' : null, place.visited ? 'Visited' : null].filter(Boolean).join(', ')}
        accessibilityActions={[
          { name: 'toggleVisited', label: place.visited ? 'Mark as not visited' : 'Mark as visited' },
          { name: 'delete', label: 'Delete' },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'toggleVisited') onToggleVisited(place);
          if (event.nativeEvent.actionName === 'delete') onDelete(place);
        }}
        testID={`place-row-${place.id}`}
      >
        <View>
          <CategoryIcon category={place.category} size={46} />
          {place.visited && (
            <View style={[styles.visitedBadge, { backgroundColor: colors.success, borderColor: colors.background }]}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
              {place.name}
            </Text>
            {place.is_favorite && <Ionicons name="heart" size={14} color={colors.primary} />}
            {place.source === 'instagram' && <Ionicons name="logo-instagram" size={13} color={colors.textTertiary} />}
          </View>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {distance && (
          <Text variant="caption" color="textTertiary">
            {distance}
          </Text>
        )}
      </PressableScale>
    </Swipeable>
  );
});

function SwipeAction({
  progress,
  color,
  icon,
  label,
  align,
}: {
  progress: SharedValue<number>;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  align: 'left' | 'right';
}) {
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.6, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1], 'clamp') }],
  }));
  return (
    <View style={[styles.action, { backgroundColor: color, alignItems: align === 'left' ? 'flex-start' : 'flex-end' }]}>
      <Animated.View style={[styles.actionContent, iconStyle]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
        <Text variant="micro" style={styles.actionLabel}>
          {label.toUpperCase()}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  text: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  title: { flexShrink: 1 },
  visitedBadge: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  action: { width: 110, justifyContent: 'center', paddingHorizontal: spacing.xl },
  actionContent: { alignItems: 'center', gap: 4 },
  actionLabel: { color: '#FFFFFF' },
});
