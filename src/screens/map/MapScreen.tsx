import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import { geocodeApi } from '../../api/endpoints';
import type { Place } from '../../api/types';
import { DraftCard, PlaceCard } from '../../components/PlaceCard';
import { PlacesMap, PlacesMapHandle } from '../../map/PlacesMap';
import type { PlaceDraft, TabScreenProps } from '../../navigation/types';
import { useUserLocation } from '../../state/location';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { CATEGORIES } from '../../theme/categories';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { haptics } from '../../ui/haptics';
import { IconButton } from '../../ui/IconButton';
import { PressableScale } from '../../ui/PressableScale';
import { Text } from '../../ui/Text';
import { useToast } from '../../ui/Toast';
import { openDirections } from '../../utils/links';

type Filter = 'all' | 'favorites' | string;

export function MapScreen({ navigation, route }: TabScreenProps<'Map'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const focused = useIsFocused();
  const toast = useToast();
  const { settings } = useSettings();
  const { places, status, update } = usePlaces();
  const { coords, permission, request } = useUserLocation();
  const mapRef = useRef<PlacesMapHandle>(null);

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<(PlaceDraft & { loading: boolean }) | null>(null);
  const framed = useRef(false);

  const visible = useMemo(() => {
    if (filter === 'all') return places;
    if (filter === 'favorites') return places.filter((place) => place.is_favorite);
    return places.filter((place) => place.category === filter);
  }, [places, filter]);

  const presentCategories = useMemo(() => CATEGORIES.filter((category) => places.some((place) => place.category === category.key)), [places]);
  const selected = places.find((place) => place.id === selectedId) ?? null;

  // Room for the search bar on top and the card/tab bar at the bottom.
  const padding = useMemo(
    () => ({ top: insets.top + 120, bottom: tabBarHeight + (selected || draft ? 200 : 40), left: 40, right: 40 }),
    [insets.top, tabBarHeight, selected, draft],
  );

  // First load: frame all places, or the user if there are none.
  useEffect(() => {
    if (framed.current || status !== 'ready') return;
    if (places.length > 0) {
      framed.current = true;
      setTimeout(() => mapRef.current?.fitTo(places), 300);
    } else if (coords) {
      framed.current = true;
      mapRef.current?.flyTo(coords, 12);
    }
  }, [status, places, coords]);

  // "Show on map" from elsewhere in the app.
  const focusPlaceId = route.params?.focusPlaceId;
  useEffect(() => {
    if (!focusPlaceId) return;
    const place = places.find((candidate) => candidate.id === focusPlaceId);
    if (place) {
      framed.current = true;
      setFilter('all');
      setDraft(null);
      setSelectedId(place.id);
      setTimeout(() => mapRef.current?.flyTo(place, 15), 250);
      navigation.setParams({ focusPlaceId: undefined });
    }
  }, [focusPlaceId, places, navigation]);

  // The selected place was deleted or filtered out.
  useEffect(() => {
    if (selectedId && !visible.some((place) => place.id === selectedId)) setSelectedId(null);
  }, [visible, selectedId]);

  const selectPlace = useCallback((place: Place | null) => {
    if (place) haptics.select();
    setDraft(null);
    setSelectedId(place?.id ?? null);
  }, []);

  const dropPin = useCallback(async (point: { latitude: number; longitude: number }) => {
    haptics.tap();
    setSelectedId(null);
    setDraft({ name: 'Dropped pin', address: '', ...point, loading: true });
    try {
      const result = await geocodeApi.reverse(point.latitude, point.longitude);
      setDraft((current) =>
        current && current.latitude === point.latitude
          ? { ...current, name: result.name, address: result.address, category: result.category, loading: false }
          : current,
      );
    } catch {
      setDraft((current) => (current && current.latitude === point.latitude ? { ...current, loading: false } : current));
    }
  }, []);

  const locateMe = async () => {
    const position = coords ?? (await request());
    if (position) mapRef.current?.flyTo(position, 14);
    else if (permission === 'blocked') toast({ message: 'Turn on location for Memory Map in Settings to see where you are.', kind: 'info' });
  };

  const toggleFavorite = async (place: Place) => {
    haptics.tap();
    try {
      await update(place.id, { is_favorite: !place.is_favorite });
    } catch (error) {
      toast({ kind: 'error', message: errorMessage(error) });
    }
  };

  const setFilterAndFrame = (next: Filter) => {
    haptics.select();
    const value = next === filter ? 'all' : next;
    setFilter(value);
    const shown =
      value === 'all' ? places : value === 'favorites' ? places.filter((p) => p.is_favorite) : places.filter((p) => p.category === value);
    if (shown.length) mapRef.current?.fitTo(shown);
  };

  const empty = status === 'ready' && places.length === 0;

  return (
    <View style={styles.flex}>
      <PlacesMap
        ref={mapRef}
        testID="places-map"
        places={visible}
        selectedId={selectedId}
        onSelect={selectPlace}
        draft={draft}
        onLongPress={dropPin}
        showUserLocation={permission === 'granted'}
        padding={padding}
      />

      {/* Search + filters */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <PressableScale
          onPress={() => navigation.navigate('AddPlace')}
          scaleTo={0.98}
          style={[styles.search, { backgroundColor: colors.surfaceElevated }, elevation(colors, 2)]}
          accessibilityLabel="Search places or paste a reel link"
          testID="map-search"
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Text variant="body" color="textTertiary" style={styles.flex} numberOfLines={1}>
            Search places or paste a reel link
          </Text>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </PressableScale>

        {places.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroller}>
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilterAndFrame('all')} floating />
            {places.some((place) => place.is_favorite) && (
              <Chip label="Favorites" icon="heart" selected={filter === 'favorites'} onPress={() => setFilterAndFrame('favorites')} floating />
            )}
            {presentCategories.map((category) => (
              <Chip
                key={category.key}
                label={category.label}
                icon={category.icon}
                color={category.color}
                selected={filter === category.key}
                onPress={() => setFilterAndFrame(category.key)}
                floating
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Map controls */}
      <View style={[styles.controls, { bottom: tabBarHeight + (selected || draft ? 220 : spacing.lg) }]} pointerEvents="box-none">
        {places.length > 1 && (
          <IconButton icon="globe-outline" appearance="floating" onPress={() => mapRef.current?.fitTo(visible.length ? visible : places)} accessibilityLabel="Show all places" />
        )}
        <IconButton
          icon={permission === 'granted' ? 'navigate' : 'navigate-outline'}
          color={colors.primary}
          appearance="floating"
          onPress={locateMe}
          accessibilityLabel="Show my location"
          testID="map-locate"
        />
      </View>

      {/* Bottom card */}
      {focused && (
        <View style={[styles.bottom, { bottom: tabBarHeight + spacing.md }]} pointerEvents="box-none">
          {selected && (
            <Animated.View key={selected.id} entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown.duration(180)}>
              <PlaceCard
                place={selected}
                near={coords}
                units={settings.units}
                onOpen={() => navigation.navigate('PlaceDetail', { placeId: selected.id })}
                onDirections={() => openDirections(selected)}
                onToggleFavorite={() => toggleFavorite(selected)}
                onClose={() => setSelectedId(null)}
              />
            </Animated.View>
          )}
          {draft && (
            <Animated.View key={`${draft.latitude},${draft.longitude}`} entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown.duration(180)}>
              <DraftCard
                title={draft.name}
                address={draft.address ?? ''}
                loading={draft.loading}
                onClose={() => setDraft(null)}
                onSave={() => {
                  const { loading: _loading, ...placeDraft } = draft;
                  setDraft(null);
                  navigation.navigate('EditPlace', { draft: placeDraft });
                }}
              />
            </Animated.View>
          )}
          {empty && !draft && (
            <Animated.View entering={FadeIn.delay(400)} exiting={FadeOut} style={[styles.emptyCard, { backgroundColor: colors.surfaceElevated }, elevation(colors, 3)]}>
              <Text variant="subheading">Your map is empty</Text>
              <Text variant="callout" color="textSecondary">
                Share a reel from Instagram to Memory Map, search for a place, or long-press anywhere on the map to drop a pin.
              </Text>
              <View style={styles.emptyActions}>
                <Button title="How to save reels" variant="secondary" size="md" style={styles.flex} onPress={() => navigation.navigate('ShareHelp')} />
                <Button title="Search" icon="search" size="md" style={styles.flex} onPress={() => navigation.navigate('AddPlace')} />
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: 'absolute', left: 0, right: 0, top: 0, gap: spacing.sm },
  search: {
    marginHorizontal: spacing.lg,
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  chipScroller: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  controls: { position: 'absolute', right: spacing.lg, gap: spacing.md },
  bottom: { position: 'absolute', left: spacing.md, right: spacing.md },
  emptyCard: { borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  emptyActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
