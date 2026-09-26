import React, { useEffect } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import type { PlacePatch } from '../../api/types';
import { PlacesMap } from '../../map/PlacesMap';
import type { RootScreenProps } from '../../navigation/types';
import { enableNearbyAlerts } from '../../nearby/nearby';
import { useUserLocation } from '../../state/location';
import { usePlace, usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { getCategory, IconName } from '../../theme/categories';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { haptics } from '../../ui/haptics';
import { IconButton } from '../../ui/IconButton';
import { Row, Section } from '../../ui/List';
import { PressableScale } from '../../ui/PressableScale';
import { Screen } from '../../ui/Screen';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Text } from '../../ui/Text';
import { useToast } from '../../ui/Toast';
import { relativeDate } from '../../utils/format';
import { distanceKm, formatDistance, formatRadius } from '../../utils/geo';
import { openDirections, sharePlace } from '../../utils/links';

const RADII_KM = [0.25, 0.5, 1, 2, 5];

export function PlaceDetailScreen({ navigation, route }: RootScreenProps<'PlaceDetail'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const place = usePlace(route.params.placeId);
  const { update, remove, status } = usePlaces();
  const { coords } = useUserLocation();
  const { settings, update: updateSettings } = useSettings();

  // Deleted elsewhere (e.g. undo window elapsed on another screen): leave.
  useEffect(() => {
    if (!place && status === 'ready' && navigation.isFocused()) {
      const timer = setTimeout(() => navigation.canGoBack() && navigation.goBack(), 50);
      return () => clearTimeout(timer);
    }
  }, [place, status, navigation]);

  if (!place) {
    return (
      <Screen>
        <EmptyState icon="location" title="Place not found" message="It may have been deleted." action={{ title: 'Go back', onPress: () => navigation.goBack() }} />
      </Screen>
    );
  }

  const category = getCategory(place.category);
  const distance = coords ? formatDistance(distanceKm(coords, place), settings.units) : null;

  const patch = async (changes: PlacePatch, successMessage?: string) => {
    try {
      await update(place.id, changes);
      if (successMessage) toast({ kind: 'success', message: successMessage });
    } catch (error) {
      toast({ kind: 'error', message: errorMessage(error) });
    }
  };

  const toggleNearby = async (enabled: boolean) => {
    if (enabled && !settings.nearbyAlerts) {
      const result = await enableNearbyAlerts();
      if (!result.ok) {
        toast({ kind: 'info', message: result.message });
        return;
      }
      updateSettings({ nearbyAlerts: true });
    }
    patch({ notify_enabled: enabled });
  };

  const confirmDelete = () => {
    haptics.warning();
    Alert.alert(`Delete ${place.name}?`, 'It will be removed from your map.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          remove(place);
        },
      },
    ]);
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(place.address || `${place.latitude}, ${place.longitude}`);
    haptics.success();
    toast({ kind: 'success', message: 'Address copied' });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={styles.mapWrap}>
          <PlacesMap
            places={[place]}
            selectedId={place.id}
            initialCenter={place}
            initialZoom={15}
            interactive={false}
            padding={{ top: insets.top + 40, bottom: 20 }}
          />
          <PressableScale
            onPress={() => navigation.navigate('Tabs', { screen: 'Map', params: { focusPlaceId: place.id } })}
            style={StyleSheet.absoluteFill}
            scaleTo={1}
            accessibilityLabel="Show on the big map"
          />
        </View>
        <View style={[styles.floatingBar, { top: insets.top + spacing.sm }]}>
          <IconButton icon="chevron-back" appearance="floating" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
          <View style={styles.flexRow}>
            <IconButton icon="share-outline" appearance="floating" onPress={() => sharePlace(place)} accessibilityLabel="Share" />
            <IconButton icon="create-outline" appearance="floating" onPress={() => navigation.navigate('EditPlace', { placeId: place.id })} accessibilityLabel="Edit" testID="detail-edit" />
          </View>
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.titleBlock}>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: `${category.color}22` }]}>
                <Ionicons name={category.icon} size={13} color={category.color} />
                <Text variant="captionStrong" style={{ color: category.color }}>
                  {category.label}
                </Text>
              </View>
              {place.source === 'instagram' && (
                <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                  <Ionicons name="logo-instagram" size={13} color={colors.textSecondary} />
                  <Text variant="captionStrong" color="textSecondary">
                    From a reel
                  </Text>
                </View>
              )}
            </View>
            <Text variant="title" accessibilityRole="header">
              {place.name}
            </Text>
            {!!place.address && (
              <PressableScale onLongPress={copyAddress} onPress={copyAddress} scaleTo={0.99} accessibilityHint="Copies the address">
                <Text variant="callout" color="textSecondary">
                  {place.address}
                </Text>
              </PressableScale>
            )}
            {distance && (
              <Text variant="caption" color="textTertiary">
                {distance} away
              </Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(motion.normal)} style={styles.actions}>
            <QuickAction icon="navigate" label="Directions" onPress={() => openDirections(place)} primary />
            <QuickAction icon="map" label="On map" onPress={() => navigation.navigate('Tabs', { screen: 'Map', params: { focusPlaceId: place.id } })} />
            {!!place.instagram_url && <QuickAction icon="logo-instagram" label="Reel" onPress={() => Linking.openURL(place.instagram_url)} />}
            <QuickAction icon="share-outline" label="Share" onPress={() => sharePlace(place)} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(motion.normal)} style={styles.toggles}>
            <TogglePill
              active={place.is_favorite}
              icon={place.is_favorite ? 'heart' : 'heart-outline'}
              label={place.is_favorite ? 'Favorite' : 'Add to favorites'}
              color={colors.primary}
              onPress={() => {
                haptics.tap();
                patch({ is_favorite: !place.is_favorite });
              }}
            />
            <TogglePill
              active={place.visited}
              icon={place.visited ? 'checkmark-circle' : 'checkmark-circle-outline'}
              label={place.visited ? 'Visited' : 'Mark visited'}
              color={colors.success}
              onPress={() => {
                haptics.success();
                patch({ visited: !place.visited });
              }}
            />
          </Animated.View>

          {(!!place.notes || !!place.description) && (
            <Animated.View entering={FadeInDown.delay(160).duration(motion.normal)}>
              <Section title="Notes">
                <PressableScale onPress={() => navigation.navigate('EditPlace', { placeId: place.id })} scaleTo={0.99} style={styles.notes}>
                  {!!place.description && <Text variant="body">{place.description}</Text>}
                  {!!place.notes && (
                    <Text variant="body" color={place.description ? 'textSecondary' : 'text'}>
                      {place.notes}
                    </Text>
                  )}
                </PressableScale>
              </Section>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).duration(motion.normal)}>
            <Section
              title="Nearby alert"
              footer={
                place.notify_enabled
                  ? `We'll let you know when you're within ${formatRadius(place.notify_radius_km, settings.units)}.`
                  : 'Get a notification when you are close to this place.'
              }
            >
              <Row
                title="Remind me when I'm nearby"
                icon="notifications-outline"
                toggle={{ value: place.notify_enabled && settings.nearbyAlerts, onChange: toggleNearby }}
              />
              {place.notify_enabled && settings.nearbyAlerts && (
                <View style={styles.radius}>
                  <SegmentedControl
                    accessibilityLabel="Alert distance"
                    value={String(place.notify_radius_km)}
                    options={RADII_KM.map((km) => ({ value: String(km), label: formatRadius(km, settings.units) }))}
                    onChange={(value) => patch({ notify_radius_km: Number(value) })}
                  />
                </View>
              )}
            </Section>
          </Animated.View>

          <Text variant="caption" color="textTertiary" align="center" style={styles.meta}>
            Saved {relativeDate(place.created_at).toLowerCase()}
            {/* The two timestamps differ by microseconds on creation - only count real edits. */}
            {Date.parse(place.updated_at) - Date.parse(place.created_at) > 60_000 ? ` · Edited ${relativeDate(place.updated_at).toLowerCase()}` : ''}
          </Text>

          <Button title="Delete place" variant="dangerSoft" icon="trash-outline" onPress={confirmDelete} testID="detail-delete" />
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} haptic style={styles.quickAction} accessibilityLabel={label}>
      <View style={[styles.quickIcon, { backgroundColor: primary ? colors.primary : colors.surface }]}>
        <Ionicons name={icon} size={21} color={primary ? colors.onPrimary : colors.text} />
      </View>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </PressableScale>
  );
}

function TogglePill({ active, icon, label, color, onPress }: { active: boolean; icon: IconName; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.pill, { backgroundColor: active ? `${color}22` : colors.surface, borderColor: active ? color : 'transparent' }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={active ? color : colors.textSecondary} />
      <Text variant="captionStrong" style={{ color: active ? color : colors.text }} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexRow: { flexDirection: 'row', gap: spacing.sm },
  mapWrap: { height: 280, overflow: 'hidden' },
  floatingBar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { marginTop: -radii.xl, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, gap: spacing.xl },
  titleBlock: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm + 2, paddingVertical: 5, borderRadius: radii.pill },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center', gap: spacing.xs + 2, minWidth: 64 },
  quickIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  toggles: { flexDirection: 'row', gap: spacing.md },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 48, borderRadius: radii.md, borderWidth: 1.5 },
  notes: { padding: spacing.lg, gap: spacing.sm },
  radius: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  meta: { marginTop: -spacing.sm },
});
