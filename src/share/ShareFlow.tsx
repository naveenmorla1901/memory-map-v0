import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { errorMessage } from '../api/client';
import { placesApi, reelsApi } from '../api/endpoints';
import type { GeocodeResult, Place } from '../api/types';
import { SearchResultRow, SearchStatus, usePlaceSearch } from '../components/PlaceSearch';
import { useTheme } from '../theme/ThemeProvider';
import { motion, radii, spacing } from '../theme/tokens';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../ui/CategoryIcon';
import { haptics } from '../ui/haptics';
import { IconButton } from '../ui/IconButton';
import { PressableScale } from '../ui/PressableScale';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { TextField } from '../ui/TextField';
import { pluralize } from '../utils/format';
import type { Coordinates, DistanceUnit } from '../utils/geo';
import { Candidate, shareReducer, ShareState, toPlaceInputs } from './shareFlowState';

export interface ShareFlowProps {
  url: string;
  /** Where to bias place search (in-app only; the extension has no location access). */
  near?: Coordinates | null;
  /** The phone's actual location, for showing distances. */
  here?: Coordinates | null;
  units?: DistanceUnit;
  onClose: () => void;
  onSaved?: (places: Place[]) => void;
  /** Extra action on the success screen, e.g. "View on map" or "Open Memory Map". */
  savedAction?: { title: string; onPress: (places: Place[]) => void };
}

/**
 * Reel link -> places found in it -> pick -> save. The same flow runs inside
 * the app, in the iOS share extension and in the Android share overlay.
 */
export function ShareFlow({ url, near, here, units, onClose, onSaved, savedAction }: ShareFlowProps) {
  const [state, dispatch] = useReducer(shareReducer, { kind: 'analyzing' } as ShareState);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (state.kind !== 'analyzing') return;
    let active = true;
    reelsApi
      .analyze(url)
      .then((result) => active && dispatch({ type: 'analyzed', result }))
      .catch((error) => active && dispatch({ type: 'failed', message: errorMessage(error) }));
    return () => {
      active = false;
    };
  }, [state.kind, url]);

  const save = useCallback(async () => {
    if (state.kind !== 'review') return;
    setSaveError(null);
    dispatch({ type: 'save' });
    try {
      const places = await placesApi.createMany(toPlaceInputs(state, url));
      haptics.success();
      dispatch({ type: 'saved', places });
      onSaved?.(places);
    } catch (error) {
      haptics.error();
      setSaveError(errorMessage(error));
      dispatch({ type: 'saveFailed' });
    }
  }, [state, url, onSaved]);

  return (
    <View style={styles.flex}>
      {state.kind === 'analyzing' && <Analyzing onClose={onClose} />}
      {state.kind === 'error' && <ErrorView message={state.message} onRetry={() => dispatch({ type: 'retry' })} onClose={onClose} />}
      {(state.kind === 'review' || state.kind === 'saving') && (
        <Review
          state={state.kind === 'review' ? state : state.previous}
          saving={state.kind === 'saving'}
          saveError={saveError}
          onToggle={(key) => dispatch({ type: 'toggle', key })}
          onSearch={(replacingKey) => dispatch({ type: 'openSearch', replacingKey })}
          onSave={save}
          onClose={onClose}
        />
      )}
      {state.kind === 'search' && (
        <SearchPanel
          initialQuery={state.initialQuery}
          replacing={state.replacingKey !== null}
          near={near}
          here={here}
          units={units}
          onBack={() => dispatch({ type: 'closeSearch' })}
          onPick={(result) => {
            haptics.select();
            dispatch({ type: 'picked', result });
          }}
        />
      )}
      {state.kind === 'saved' && <Saved places={state.places} onDone={onClose} savedAction={savedAction} />}
    </View>
  );
}

// --- Analyzing -------------------------------------------------------------

const ANALYZING_STEPS = ['Reading the reel…', 'Looking for places…', 'Finding them on the map…'];

function Analyzing({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, ANALYZING_STEPS.length - 1)), 2200);
    return () => clearInterval(timer);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.flex}>
      <FlowHeader onClose={onClose} />
      <View style={styles.analyzingTop} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }, pulseStyle]}>
          <Ionicons name="sparkles" size={30} color={colors.primary} />
        </Animated.View>
        <Animated.View key={step} entering={FadeInDown.duration(motion.normal)} exiting={FadeOut.duration(motion.fast)}>
          <Text variant="heading" align="center">
            {ANALYZING_STEPS[step]}
          </Text>
        </Animated.View>
        <Text variant="caption" color="textTertiary" align="center">
          This usually takes a few seconds.
        </Text>
      </View>
      <View style={styles.skeletons}>
        {[0, 1, 2].map((index) => (
          <Animated.View key={index} entering={FadeIn.delay(index * 150)} style={styles.skeletonRow}>
            <Skeleton width={40} height={40} radius={20} />
            <View style={styles.flexGap}>
              <Skeleton width={`${60 - index * 10}%`} height={14} />
              <Skeleton width={`${40 + index * 8}%`} height={11} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// --- Review ----------------------------------------------------------------

interface ReviewProps {
  state: ShareState & { kind: 'review' };
  saving: boolean;
  saveError: string | null;
  onToggle: (key: string) => void;
  onSearch: (replacingKey?: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function Review({ state, saving, saveError, onToggle, onSearch, onSave, onClose }: ReviewProps) {
  const { colors } = useTheme();
  const { candidates, selected, manualReason } = state;
  const count = selected.length;
  // Nothing new left to tick: everything found is saved (or couldn't be located).
  const allSaved =
    candidates.some((candidate) => candidate.alreadySaved) &&
    candidates.every((candidate) => candidate.alreadySaved || candidate.latitude === null);

  const title = candidates.length === 0
    ? 'Which place is it?'
    : allSaved
      ? 'Already on your map'
      : candidates.length === 1
        ? 'Found a place'
        : `Found ${candidates.length} places`;

  return (
    <View style={styles.flex}>
      <FlowHeader onClose={onClose} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.reviewContent} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.titleBlock}>
          <Text variant="title">{title}</Text>
          {manualReason ? (
            <Text variant="callout" color="textSecondary">
              {manualReason} Search for it below.
            </Text>
          ) : allSaved ? (
            <Text variant="callout" color="textSecondary">
              You've already saved everything we found in this reel. Missing something? Search for it below.
            </Text>
          ) : (
            <Text variant="callout" color="textSecondary">
              Untick anything you don't want to save.
            </Text>
          )}
        </Animated.View>

        {candidates.map((candidate, index) => (
          <Animated.View key={candidate.key} entering={FadeInDown.delay(60 + index * 70).duration(motion.normal)} layout={LinearTransition}>
            <CandidateRow
              candidate={candidate}
              checked={selected.includes(candidate.key)}
              onToggle={() => onToggle(candidate.key)}
              onFind={() => onSearch(candidate.key)}
            />
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(60 + candidates.length * 70).duration(motion.normal)}>
          <PressableScale onPress={() => onSearch()} scaleTo={0.98} style={[styles.addRow, { borderColor: colors.border }]} testID="share-search">
            <Ionicons name="search" size={20} color={colors.primary} />
            <Text variant="bodyStrong" color="primary">
              {candidates.length === 0 ? 'Search for the place' : 'Add a place yourself'}
            </Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.separator }]}>
        {saveError && (
          <Text variant="caption" color="danger" align="center" accessibilityLiveRegion="polite">
            {saveError}
          </Text>
        )}
        <Button
          title={count === 0 ? 'Choose a place to save' : `Save ${pluralize(count, 'place')}`}
          icon={count > 0 ? 'bookmark' : undefined}
          disabled={count === 0}
          loading={saving}
          onPress={onSave}
          testID="share-save"
        />
      </View>
    </View>
  );
}

function CandidateRow({ candidate, checked, onToggle, onFind }: { candidate: Candidate; checked: boolean; onToggle: () => void; onFind: () => void }) {
  const { colors } = useTheme();
  const located = candidate.latitude !== null;
  const disabled = candidate.alreadySaved || !located;

  return (
    <PressableScale
      onPress={located ? onToggle : onFind}
      disabled={candidate.alreadySaved}
      scaleTo={0.98}
      style={[styles.candidate, { backgroundColor: colors.surface }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={`${candidate.name}${candidate.address ? `, ${candidate.address}` : ''}`}
      accessibilityHint={candidate.alreadySaved ? 'Already saved' : located ? undefined : 'Location not found. Double tap to search for it.'}
    >
      <CategoryIcon category={candidate.category} size={42} />
      <View style={styles.flexGap}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {candidate.name}
        </Text>
        {located ? (
          !!candidate.address && (
            <Text variant="caption" color="textSecondary" numberOfLines={2}>
              {candidate.address}
            </Text>
          )
        ) : (
          <Text variant="caption" color="warning">
            Couldn't find it on the map - tap to search
          </Text>
        )}
      </View>
      {candidate.alreadySaved ? (
        <View style={[styles.savedBadge, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark" size={13} color={colors.success} />
          <Text variant="micro" color="success">
            SAVED
          </Text>
        </View>
      ) : located ? (
        <Checkbox checked={checked} />
      ) : (
        <Ionicons name="search" size={20} color={colors.textTertiary} />
      )}
    </PressableScale>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    scale.value = checked ? withSpring(1, motion.bouncy) : withTiming(0, { duration: motion.fast });
  }, [checked, scale]);
  const fill = useAnimatedStyle(() => ({ opacity: scale.value, transform: [{ scale: 0.5 + scale.value * 0.5 }] }));
  return (
    <View style={[styles.checkbox, { borderColor: checked ? colors.primary : colors.border }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.checkFill, { backgroundColor: colors.primary }, fill]}>
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

// --- Search ----------------------------------------------------------------

function SearchPanel({
  initialQuery,
  replacing,
  near,
  here,
  units,
  onBack,
  onPick,
}: {
  initialQuery: string;
  replacing: boolean;
  near?: Coordinates | null;
  here?: Coordinates | null;
  units?: DistanceUnit;
  onBack: () => void;
  onPick: (result: GeocodeResult) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const search = usePlaceSearch(query, near);
  return (
    <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.flex}>
      <View style={styles.searchHeader}>
        <IconButton icon="chevron-back" appearance="filled" onPress={onBack} accessibilityLabel="Back" />
        <Text variant="subheading" style={styles.flex}>
          {replacing ? 'Find the right place' : 'Add a place'}
        </Text>
      </View>
      <View style={styles.searchBox}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or address"
          icon="search"
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search for a place"
          testID="share-search-input"
        />
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.searchResults} keyboardShouldPersistTaps="handled">
        {search.results.map((result) => (
          <SearchResultRow key={result.id} result={result} near={here} units={units} onPress={() => onPick(result)} />
        ))}
        <SearchStatus state={search} query={query} />
      </ScrollView>
    </Animated.View>
  );
}

// --- Saved -----------------------------------------------------------------

function Saved({ places, onDone, savedAction }: { places: Place[]; onDone: () => void; savedAction?: ShareFlowProps['savedAction'] }) {
  const { colors } = useTheme();
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withDelay(150, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [ring]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - ring.value), transform: [{ scale: 1 + ring.value * 0.9 }] }));

  return (
    <View style={styles.savedContainer} accessibilityLiveRegion="polite">
      <View style={styles.savedIconWrap}>
        <Animated.View style={[styles.savedRing, { backgroundColor: colors.success }, ringStyle]} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.savedIcon, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(200).duration(motion.normal)} style={styles.titleBlock}>
        <Text variant="title" align="center">
          Saved to your map
        </Text>
        <Text variant="callout" color="textSecondary" align="center" numberOfLines={3}>
          {places.map((place) => place.name).join(' · ')}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(320).duration(motion.normal)} style={styles.savedActions}>
        <Button title="Done" onPress={onDone} testID="share-done" />
        {savedAction && <Button title={savedAction.title} variant="ghost" onPress={() => savedAction.onPress(places)} />}
      </Animated.View>
    </View>
  );
}

// --- Error & shared ----------------------------------------------------------

function ErrorView({ message, onRetry, onClose }: { message: string; onRetry: () => void; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.flex}>
      <FlowHeader onClose={onClose} />
      <View style={styles.errorBody}>
        <Animated.View entering={ZoomIn.springify()} style={[styles.bigIcon, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
        </Animated.View>
        <Text variant="heading" align="center">
          Couldn't check this reel
        </Text>
        <Text variant="callout" color="textSecondary" align="center">
          {message}
        </Text>
        <Button title="Try again" icon="refresh" onPress={onRetry} style={styles.stretch} />
      </View>
    </View>
  );
}

function FlowHeader({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.flowHeader}>
      <View style={[styles.brand, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="map" size={14} color={colors.primary} />
        <Text variant="micro" color="primary">
          MEMORY MAP
        </Text>
      </View>
      <IconButton icon="close" appearance="filled" size={20} onPress={onClose} accessibilityLabel="Close" testID="share-close" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGap: { flex: 1, gap: 4 },
  stretch: { alignSelf: 'stretch' },
  flowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.pill },
  analyzingTop: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  bigIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  skeletons: { padding: spacing.xl, gap: spacing.lg, marginTop: spacing.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  titleBlock: { gap: spacing.xs, marginBottom: spacing.md },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, overflow: 'hidden' },
  checkFill: { alignItems: 'center', justifyContent: 'center' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  searchHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchBox: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  searchResults: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  savedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.lg },
  savedIconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  savedRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48 },
  savedIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  savedActions: { alignSelf: 'stretch', gap: spacing.xs },
  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
});
