import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  Camera,
  CameraRef,
  GeoJSONSource,
  GeoJSONSourceRef,
  Layer,
  Map,
  MapRef,
  Marker,
  NativeUserLocation,
  type ViewPadding,
} from '@maplibre/maplibre-react-native';

import type { Place } from '../api/types';
import { MAP_FONTS, MAP_STYLES } from '../config';
import { CATEGORY_COLOR_EXPRESSION } from '../theme/categories';
import { useTheme } from '../theme/ThemeProvider';
import { boundsOf, Coordinates } from '../utils/geo';
import { Pin } from './Pin';

export interface PlacesMapHandle {
  flyTo: (coords: Coordinates, zoom?: number) => void;
  /** Frame every place (or the given points), leaving room for overlays. */
  fitTo: (points: Coordinates[]) => void;
}

interface PlacesMapProps {
  places: Place[];
  selectedId?: string | null;
  onSelect?: (place: Place | null) => void;
  /** A not-yet-saved point (dropped pin or search result). */
  draft?: Coordinates | null;
  onLongPress?: (coords: Coordinates) => void;
  showUserLocation?: boolean;
  /** Space taken by UI over the map, so framing keeps pins visible. */
  padding?: ViewPadding;
  initialCenter?: Coordinates;
  initialZoom?: number;
  interactive?: boolean;
  testID?: string;
}

const SOURCE_ID = 'mm-places';
const LAYER_CLUSTERS = 'mm-clusters';
const LAYER_POINTS = 'mm-points';

const WORLD: Coordinates = { latitude: 25, longitude: 10 };

export const PlacesMap = forwardRef<PlacesMapHandle, PlacesMapProps>(function PlacesMap(
  { places, selectedId, onSelect, draft, onLongPress, showUserLocation, padding, initialCenter, initialZoom, interactive = true, testID },
  ref,
) {
  const { isDark, colors } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);
  const paddingRef = useRef(padding);
  paddingRef.current = padding;

  const selected = places.find((place) => place.id === selectedId) ?? null;

  const data = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: places
        // The selected place is drawn as a big pin instead.
        .filter((place) => place.id !== selectedId)
        .map((place) => ({
          type: 'Feature',
          id: place.id,
          geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] },
          properties: { id: place.id, name: place.name, category: place.category, favorite: place.is_favorite, visited: place.visited },
        })),
    }),
    [places, selectedId],
  );

  useImperativeHandle(ref, () => ({
    flyTo: (coords, zoom = 15) => {
      cameraRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom, duration: 900, padding: paddingRef.current });
    },
    fitTo: (points) => {
      if (points.length === 1) {
        cameraRef.current?.easeTo({ center: [points[0].longitude, points[0].latitude], zoom: 14, duration: 800, padding: paddingRef.current });
        return;
      }
      const bounds = boundsOf(points);
      if (bounds) cameraRef.current?.fitBounds(bounds, { padding: paddingRef.current, duration: 800 });
    },
  }));

  const handlePress = useCallback(
    async (event: { nativeEvent: { point: [number, number] } }) => {
      if (!onSelect) return;
      const features = await mapRef.current
        ?.queryRenderedFeatures(event.nativeEvent.point, { layers: [LAYER_CLUSTERS, LAYER_POINTS] })
        .catch(() => []);
      const feature = features?.[0];
      if (!feature) {
        onSelect(null);
        return;
      }
      const properties = feature.properties ?? {};
      if (properties.cluster) {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const zoom = await sourceRef.current?.getClusterExpansionZoom(properties.cluster_id).catch(() => undefined);
        cameraRef.current?.easeTo({ center: coordinates, zoom: (zoom ?? 12) + 0.5, duration: 600 });
        return;
      }
      const place = places.find((candidate) => candidate.id === properties.id);
      if (place) onSelect(place);
    },
    [onSelect, places],
  );

  const start = initialCenter ?? WORLD;

  return (
    <Map
      ref={mapRef}
      testID={testID}
      style={StyleSheet.absoluteFill}
      mapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
      logo={false}
      attribution
      attributionPosition={{ bottom: (padding?.bottom ?? 0) + 8, left: 8 }}
      compass={interactive}
      compassPosition={{ top: (padding?.top ?? 0) + 8, right: 12 }}
      dragPan={interactive}
      touchZoom={interactive}
      doubleTapZoom={interactive}
      touchRotate={interactive}
      touchPitch={false}
      tintColor={colors.primary}
      onPress={interactive ? handlePress : undefined}
      onLongPress={
        onLongPress
          ? (event) => onLongPress({ longitude: event.nativeEvent.lngLat[0], latitude: event.nativeEvent.lngLat[1] })
          : undefined
      }
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: [start.longitude, start.latitude], zoom: initialZoom ?? (initialCenter ? 13 : 1.3) }}
        minZoom={1}
        maxZoom={19}
      />

      <GeoJSONSource id={SOURCE_ID} ref={sourceRef} data={data} cluster clusterRadius={46} clusterMaxZoom={14}>
        <Layer
          id={LAYER_CLUSTERS}
          type="circle"
          filter={['has', 'point_count']}
          style={{
            circleColor: colors.primary,
            circleRadius: ['step', ['get', 'point_count'], 17, 10, 21, 50, 27] as never,
            circleStrokeWidth: 3,
            circleStrokeColor: '#FFFFFF',
            circleOpacity: 0.95,
          }}
        />
        <Layer
          id="mm-cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          style={{
            textField: ['get', 'point_count_abbreviated'] as never,
            textFont: MAP_FONTS.bold,
            textSize: 13,
            textColor: '#FFFFFF',
            textAllowOverlap: true,
            textIgnorePlacement: true,
          }}
        />
        <Layer
          id={LAYER_POINTS}
          type="circle"
          filter={['!', ['has', 'point_count']]}
          style={{
            circleColor: CATEGORY_COLOR_EXPRESSION as never,
            circleRadius: ['interpolate', ['linear'], ['zoom'], 3, 6, 12, 9, 16, 11] as never,
            circleStrokeWidth: ['case', ['get', 'favorite'], 3.5, 2.5] as never,
            circleStrokeColor: ['case', ['get', 'favorite'], colors.star, '#FFFFFF'] as never,
            circleOpacity: ['case', ['get', 'visited'], 0.7, 1] as never,
          }}
        />
        <Layer
          id="mm-point-labels"
          type="symbol"
          filter={['!', ['has', 'point_count']]}
          minzoom={12}
          style={{
            textField: ['get', 'name'] as never,
            textFont: MAP_FONTS.bold,
            textSize: 12,
            textOffset: [0, 1.25],
            textAnchor: 'top',
            textMaxWidth: 9,
            textOptional: true,
            textColor: isDark ? '#F4F4F6' : '#1C1C21',
            textHaloColor: isDark ? '#0D0D10' : '#FFFFFF',
            textHaloWidth: 1.5,
          }}
        />
      </GeoJSONSource>

      {selected && (
        <Marker key={`selected-${selected.id}`} id="mm-selected" lngLat={[selected.longitude, selected.latitude]} anchor="bottom">
          <Pin category={selected.category} />
        </Marker>
      )}

      {draft && (
        <Marker key={`draft-${draft.latitude},${draft.longitude}`} id="mm-draft" lngLat={[draft.longitude, draft.latitude]} anchor="bottom">
          <Pin color={colors.primary} icon="add" pulse />
        </Marker>
      )}

      {showUserLocation && <NativeUserLocation />}
    </Map>
  );
});
