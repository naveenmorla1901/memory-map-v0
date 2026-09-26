import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../api/client';
import { geocodeApi } from '../api/endpoints';
import type { GeocodeResult } from '../api/types';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { CategoryIcon } from '../ui/CategoryIcon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';
import { Coordinates, distanceKm, DistanceUnit, formatDistance } from '../utils/geo';

interface SearchState {
  results: GeocodeResult[];
  loading: boolean;
  error: string | null;
  /** The query the current results are for. */
  searched: string;
}

/** Debounced place search; ignores responses for queries the user has already typed past. */
export function usePlaceSearch(query: string, near?: Coordinates | null, delayMs = 300): SearchState {
  const [state, setState] = useState<SearchState>({ results: [], loading: false, error: null, searched: '' });
  const latest = useRef(0);
  const nearRef = useRef(near);
  nearRef.current = near;

  useEffect(() => {
    const trimmed = query.trim();
    const requestId = ++latest.current;
    if (trimmed.length < 2) {
      setState({ results: [], loading: false, error: null, searched: '' });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const timer = setTimeout(async () => {
      try {
        const results = await geocodeApi.search(trimmed, nearRef.current);
        if (requestId === latest.current) setState({ results, loading: false, error: null, searched: trimmed });
      } catch (error) {
        if (requestId === latest.current) setState({ results: [], loading: false, error: errorMessage(error), searched: trimmed });
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs]);

  return state;
}

export function SearchResultRow({
  result,
  near,
  units = 'km',
  onPress,
}: {
  result: GeocodeResult;
  near?: Coordinates | null;
  units?: DistanceUnit;
  onPress: () => void;
}) {
  const distance = near ? formatDistance(distanceKm(near, result), units) : null;
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.row} accessibilityLabel={`${result.name}, ${result.address}`}>
      <CategoryIcon category={result.category} size={38} />
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {result.name}
        </Text>
        {!!result.address && (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {result.address}
          </Text>
        )}
      </View>
      {distance && (
        <Text variant="caption" color="textTertiary">
          {distance}
        </Text>
      )}
    </PressableScale>
  );
}

/** Status line under a search box: spinner, error, or "no results". */
export function SearchStatus({ state, query }: { state: SearchState; query: string }) {
  const { colors } = useTheme();
  if (state.loading && state.results.length === 0) {
    return (
      <View style={styles.status}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (state.error) {
    return (
      <Text variant="callout" color="danger" style={styles.status}>
        {state.error}
      </Text>
    );
  }
  if (state.searched && state.results.length === 0 && query.trim() === state.searched) {
    return (
      <Text variant="callout" color="textSecondary" align="center" style={styles.status}>
        No places match "{state.searched}". Try adding the city, like "{state.searched}, Paris".
      </Text>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  text: { flex: 1, gap: 2 },
  status: { paddingVertical: spacing.xl, alignItems: 'center' },
});
