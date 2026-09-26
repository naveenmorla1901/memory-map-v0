import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { errorMessage } from '../../api/client';
import type { Place } from '../../api/types';
import { PlaceRow } from '../../components/PlaceRow';
import type { TabScreenProps } from '../../navigation/types';
import { useUserLocation } from '../../state/location';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { CATEGORIES } from '../../theme/categories';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, radii, spacing } from '../../theme/tokens';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { haptics } from '../../ui/haptics';
import { IconButton } from '../../ui/IconButton';
import { PressableScale } from '../../ui/PressableScale';
import { Screen } from '../../ui/Screen';
import { Sheet } from '../../ui/Sheet';
import { PlaceRowSkeleton } from '../../ui/Skeleton';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { pluralize } from '../../utils/format';
import { distanceKm, formatDistance } from '../../utils/geo';

type Sort = 'newest' | 'oldest' | 'name' | 'nearest';
type Filter = 'all' | 'toVisit' | 'visited' | 'favorites' | 'instagram' | string;

const SORTS: { value: Sort; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'newest', label: 'Recently saved', icon: 'time-outline' },
  { value: 'nearest', label: 'Nearest to me', icon: 'navigate-outline' },
  { value: 'name', label: 'Name (A-Z)', icon: 'text-outline' },
  { value: 'oldest', label: 'Oldest first', icon: 'hourglass-outline' },
];

const FILTERS: { value: Filter; label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'all', label: 'All' },
  { value: 'toVisit', label: 'Want to go', icon: 'bookmark' },
  { value: 'visited', label: 'Visited', icon: 'checkmark-circle' },
  { value: 'favorites', label: 'Favorites', icon: 'heart' },
  { value: 'instagram', label: 'From reels', icon: 'logo-instagram' },
];

function matches(place: Place, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'toVisit':
      return !place.visited;
    case 'visited':
      return place.visited;
    case 'favorites':
      return place.is_favorite;
    case 'instagram':
      return place.source === 'instagram';
    default:
      return place.category === filter;
  }
}

export function PlacesScreen({ navigation }: TabScreenProps<'Places'>) {
  const { colors } = useTheme();
  const toast = useToast();
  const { settings } = useSettings();
  const { places, status, stale, error, refresh, update, remove } = usePlaces();
  const { coords, request } = useUserLocation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categoriesInUse = useMemo(() => CATEGORIES.filter((category) => places.some((place) => place.category === category.key)), [places]);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = places.filter(
      (place) =>
        matches(place, filter) &&
        (!term || [place.name, place.address, place.notes, place.description].some((text) => text.toLowerCase().includes(term))),
    );
    const sorted = [...filtered];
    if (sort === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (sort === 'nearest' && coords) sorted.sort((a, b) => distanceKm(coords, a) - distanceKm(coords, b));
    return sorted;
  }, [places, query, filter, sort, coords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const toggleVisited = useCallback(
    async (place: Place) => {
      haptics.success();
      try {
        await update(place.id, { visited: !place.visited });
        toast({ kind: 'success', message: place.visited ? `${place.name} marked as not visited` : `${place.name} marked as visited` });
      } catch (err) {
        toast({ kind: 'error', message: errorMessage(err) });
      }
    },
    [update, toast],
  );

  const openPlace = useCallback((place: Place) => navigation.navigate('PlaceDetail', { placeId: place.id }), [navigation]);

  const chooseSort = async (value: Sort) => {
    setSortOpen(false);
    if (value === 'nearest' && !coords) {
      const position = await request();
      if (!position) {
        toast({ message: 'Allow location access to sort by distance.', kind: 'info' });
        return;
      }
    }
    setSort(value);
  };

  const filtering = filter !== 'all' || query.trim().length > 0;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="title" accessibilityRole="header">
            Places
          </Text>
          {places.length > 0 && (
            <Animated.View entering={FadeIn}>
              <Text variant="callout" color="textSecondary">
                {filtering ? `${shown.length} of ${pluralize(places.length, 'place')}` : pluralize(places.length, 'place')}
              </Text>
            </Animated.View>
          )}
        </View>
        {places.length > 1 && <IconButton icon="swap-vertical" appearance="filled" onPress={() => setSortOpen(true)} accessibilityLabel="Sort places" />}
        <IconButton icon="add" appearance="filled" color={colors.primary} onPress={() => navigation.navigate('AddPlace')} accessibilityLabel="Add a place" testID="places-add" />
      </View>

      {places.length > 0 && (
        <>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search your places"
            icon="search"
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            accessibilityLabel="Search your places"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroller}>
            {FILTERS.filter((option) => option.value !== 'instagram' || places.some((place) => place.source === 'instagram')).map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                icon={option.icon}
                selected={filter === option.value}
                onPress={() => {
                  haptics.select();
                  setFilter(option.value);
                }}
              />
            ))}
            {categoriesInUse.length > 1 &&
              categoriesInUse.map((category) => (
                <Chip
                  key={category.key}
                  label={category.label}
                  icon={category.icon}
                  color={category.color}
                  selected={filter === category.key}
                  onPress={() => {
                    haptics.select();
                    setFilter(filter === category.key ? 'all' : category.key);
                  }}
                />
              ))}
          </ScrollView>
        </>
      )}

      {stale && error && (
        <Animated.View entering={FadeInDown} style={[styles.notice, { backgroundColor: colors.surface }]}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.textSecondary} />
          <Text variant="caption" color="textSecondary" style={styles.flex}>
            Showing the copy saved on this phone. {error}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  let empty: React.ReactNode = null;
  if (status === 'loading') {
    empty = <PlaceRowSkeleton />;
  } else if (status === 'error') {
    empty = <EmptyState icon="cloud-offline-outline" title="Couldn't load your places" message={error ?? undefined} action={{ title: 'Try again', icon: 'refresh', onPress: refresh }} compact />;
  } else if (places.length === 0) {
    empty = (
      <EmptyState
        icon="map-outline"
        title="No places yet"
        message="Share a reel from Instagram, search for a place, or drop a pin on the map."
        action={{ title: 'Add a place', icon: 'add', onPress: () => navigation.navigate('AddPlace') }}
        secondaryAction={{ title: 'How to save from Instagram', onPress: () => navigation.navigate('ShareHelp') }}
        compact
      />
    );
  } else {
    empty = (
      <EmptyState
        icon="search"
        title="Nothing matches"
        message={query ? `No saved places match "${query.trim()}".` : 'No places in this filter yet.'}
        action={{ title: 'Clear filters', onPress: () => { setQuery(''); setFilter('all'); } }}
        compact
      />
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        data={status === 'loading' && places.length === 0 ? [] : shown}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => (
          <Animated.View layout={LinearTransition.duration(motion.normal)}>
            <PlaceRow
              place={item}
              distance={coords ? formatDistance(distanceKm(coords, item), settings.units) : null}
              onPress={openPlace}
              onToggleVisited={toggleVisited}
              onDelete={remove}
            />
          </Animated.View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        initialNumToRender={14}
        windowSize={11}
        testID="places-list"
      />

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <View style={styles.sheetOptions}>
          {SORTS.map((option) => (
            <PressableScale
              key={option.value}
              onPress={() => chooseSort(option.value)}
              scaleTo={0.98}
              style={[styles.sortOption, sort === option.value && { backgroundColor: colors.primarySoft }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: sort === option.value }}
            >
              <Ionicons name={option.icon} size={20} color={sort === option.value ? colors.primary : colors.textSecondary} />
              <Text variant="body" style={styles.flex}>
                {option.label}
              </Text>
              {sort === option.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chipScroller: { marginHorizontal: -spacing.xl },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md },
  list: { flexGrow: 1, paddingBottom: spacing.xxxl },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 78 },
  sheetOptions: { paddingHorizontal: spacing.md, gap: spacing.xs },
  sortOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.md },
});
