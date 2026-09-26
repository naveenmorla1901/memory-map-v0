import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Camera, CameraRef, Map, NativeUserLocation } from '@maplibre/maplibre-react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { geocodeApi } from '../../api/endpoints';
import type { GeocodeResult } from '../../api/types';
import { MAP_STYLES } from '../../config';
import { Pin } from '../../map/Pin';
import type { RootScreenProps } from '../../navigation/types';
import { useUserLocation } from '../../state/location';
import { useTheme } from '../../theme/ThemeProvider';
import { elevation, motion, radii, spacing } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { haptics } from '../../ui/haptics';
import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

/** Drag the map under a fixed pin to choose a point. */
export function PickLocationScreen({ navigation, route }: RootScreenProps<'PickLocation'>) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { coords, permission, request } = useUserLocation();
  const cameraRef = useRef<CameraRef>(null);
  const start = route.params.initial ?? coords;
  const [center, setCenter] = useState(start ?? { latitude: 25, longitude: 10 });
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const lift = useSharedValue(0);
  const lookup = useRef(0);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 14 }] }));
  const shadowStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - lift.value * 0.4 }], opacity: 0.35 - lift.value * 0.2 }));

  const resolve = useCallback(async (point: { latitude: number; longitude: number }) => {
    const id = ++lookup.current;
    setResolving(true);
    try {
      const result = await geocodeApi.reverse(point.latitude, point.longitude);
      if (id === lookup.current) setPlace(result);
    } catch {
      if (id === lookup.current) setPlace(null);
    } finally {
      if (id === lookup.current) setResolving(false);
    }
  }, []);

  useEffect(() => {
    if (start) resolve(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = () => {
    haptics.success();
    const picked = { latitude: center.latitude, longitude: center.longitude, address: place?.address ?? '', name: place?.name };
    if (route.params.mode === 'return') {
      navigation.popTo('EditPlace', { picked }, { merge: true });
    } else {
      navigation.replace('EditPlace', {
        draft: { name: place?.name ?? 'Dropped pin', address: place?.address, category: place?.category, latitude: center.latitude, longitude: center.longitude },
      });
    }
  };

  return (
    <View style={styles.flex}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
        logo={false}
        attributionPosition={{ bottom: 190 + insets.bottom, left: 8 }}
        touchPitch={false}
        onRegionWillChange={(event) => {
          if (event.nativeEvent.userInteraction) lift.value = withTiming(1, { duration: motion.fast });
        }}
        onRegionDidChange={(event) => {
          lift.value = withSpring(0, motion.bouncy);
          const [longitude, latitude] = event.nativeEvent.center;
          setCenter({ latitude, longitude });
          resolve({ latitude, longitude });
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: start ? [start.longitude, start.latitude] : [10, 25], zoom: start ? 16 : 1.5 }}
        />
        {permission === 'granted' && <NativeUserLocation />}
      </Map>

      {/* The pin stays centered; the map moves under it. Its tip marks the point. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={[styles.pinShadow, shadowStyle]} />
        <Animated.View style={[styles.pin, pinStyle]}>
          <Pin color={colors.primary} icon="add" />
        </Animated.View>
      </View>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <IconButton icon="close" appearance="floating" onPress={() => navigation.goBack()} accessibilityLabel="Cancel" />
        <IconButton
          icon="navigate"
          color={colors.primary}
          appearance="floating"
          accessibilityLabel="Go to my location"
          onPress={async () => {
            const position = coords ?? (await request());
            if (position) cameraRef.current?.flyTo({ center: [position.longitude, position.latitude], zoom: 16, duration: 800 });
          }}
        />
      </View>

      <Animated.View
        entering={FadeInDown.springify()}
        style={[styles.card, { backgroundColor: colors.surfaceElevated, marginBottom: insets.bottom + spacing.md }, elevation(colors, 3)]}
      >
        <Text variant="micro" color="textTertiary">
          DRAG THE MAP TO PLACE THE PIN
        </Text>
        <View style={styles.address}>
          {resolving && !place ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text variant="subheading" numberOfLines={1}>
                {place?.name ?? 'Dropped pin'}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={2}>
                {place?.address || `${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)}`}
              </Text>
            </>
          )}
        </View>
        <Button title="Use this location" icon="checkmark" onPress={confirm} testID="pick-confirm" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  // Pin is 64 tall and anchored at its tip, so lift it by half its height.
  pin: { marginBottom: 64 },
  pinShadow: { position: 'absolute', width: 14, height: 6, borderRadius: 7, backgroundColor: '#000' },
  topBar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  card: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 0, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  address: { minHeight: 44, justifyContent: 'center', gap: 2 },
});
