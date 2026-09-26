import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Place } from '../api/types';
import { getCategory } from '../theme/categories';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, radii, spacing } from '../theme/tokens';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../ui/CategoryIcon';
import { IconButton } from '../ui/IconButton';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';
import { Coordinates, distanceKm, DistanceUnit, formatDistance, shortAddress } from '../utils/geo';

/** Preview of a saved place, floating over the map. */
export function PlaceCard({
  place,
  near,
  units,
  onOpen,
  onDirections,
  onToggleFavorite,
  onClose,
}: {
  place: Place;
  near: Coordinates | null;
  units: DistanceUnit;
  onOpen: () => void;
  onDirections: () => void;
  onToggleFavorite: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const category = getCategory(place.category);
  const meta = [category.label, near ? formatDistance(distanceKm(near, place), units) : null, place.visited ? 'Visited' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated }, elevation(colors, 3)]}>
      <PressableScale onPress={onOpen} scaleTo={0.98} style={styles.top} accessibilityHint="Opens the place's details" testID="place-card">
        <CategoryIcon category={place.category} size={48} solid />
        <View style={styles.text}>
          <Text variant="subheading" numberOfLines={1}>
            {place.name}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {meta}
          </Text>
          {!!place.address && (
            <Text variant="caption" color="textTertiary" numberOfLines={1}>
              {shortAddress(place.address)}
            </Text>
          )}
        </View>
        <IconButton
          icon={place.is_favorite ? 'heart' : 'heart-outline'}
          color={place.is_favorite ? colors.primary : colors.textSecondary}
          onPress={onToggleFavorite}
          accessibilityLabel={place.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        />
        <IconButton icon="close" size={20} color={colors.textTertiary} onPress={onClose} accessibilityLabel="Close preview" />
      </PressableScale>
      <View style={styles.actions}>
        <Button title="Directions" icon="navigate" size="md" style={styles.action} onPress={onDirections} />
        <Button title="Details" variant="secondary" size="md" style={styles.action} onPress={onOpen} />
      </View>
    </View>
  );
}

/** Preview of a dropped pin, before it's saved. */
export function DraftCard({
  title,
  address,
  loading,
  onSave,
  onClose,
}: {
  title: string;
  address: string;
  loading: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated }, elevation(colors, 3)]}>
      <View style={styles.top}>
        <View style={[styles.draftIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="pin" size={24} color={colors.primary} />
        </View>
        <View style={styles.text}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <>
              <Text variant="subheading" numberOfLines={1}>
                {title}
              </Text>
              {!!address && (
                <Text variant="caption" color="textSecondary" numberOfLines={2}>
                  {address}
                </Text>
              )}
            </>
          )}
        </View>
        <IconButton icon="close" size={20} color={colors.textTertiary} onPress={onClose} accessibilityLabel="Remove pin" />
      </View>
      <Button title="Save this place" icon="bookmark" size="md" onPress={onSave} disabled={loading} testID="draft-save" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2, minHeight: 44, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  draftIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  loading: { alignSelf: 'flex-start' },
});
