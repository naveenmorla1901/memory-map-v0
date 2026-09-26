import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SearchResultRow, SearchStatus, usePlaceSearch } from '../../components/PlaceSearch';
import type { RootScreenProps } from '../../navigation/types';
import { useUserLocation } from '../../state/location';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { useTheme } from '../../theme/ThemeProvider';
import { IconName } from '../../theme/categories';
import { motion, radii, spacing } from '../../theme/tokens';
import { IconButton } from '../../ui/IconButton';
import { PressableScale } from '../../ui/PressableScale';
import { Screen } from '../../ui/Screen';
import { Text } from '../../ui/Text';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { extractInstagramUrl } from '../../utils/instagram';
import { searchBias } from '../../utils/geo';

/** Search for a place to save, paste a reel link, or drop a pin. */
export function AddPlaceScreen({ navigation, route }: RootScreenProps<'AddPlace'>) {
  const { colors } = useTheme();
  const toast = useToast();
  const { coords } = useUserLocation();
  const { places } = usePlaces();
  const near = useMemo(() => searchBias(coords, places), [coords, places]);
  const { settings } = useSettings();
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [clipboardHasText, setClipboardHasText] = useState(false);
  const reelUrl = extractInstagramUrl(query);
  const search = usePlaceSearch(reelUrl ? '' : query, near);

  // Checking *whether* there's text doesn't trigger iOS's paste prompt; reading it does, so only read on tap.
  useEffect(() => {
    Clipboard.hasStringAsync().then(setClipboardHasText).catch(() => {});
  }, []);

  const paste = async () => {
    const text = await Clipboard.getStringAsync().catch(() => '');
    const url = extractInstagramUrl(text);
    if (url) navigation.replace('Share', { url });
    else if (text.trim()) setQuery(text.trim().slice(0, 200));
    else toast({ message: 'Your clipboard is empty.', kind: 'info' });
  };

  const showShortcuts = query.trim().length === 0;

  return (
    <Screen padded={false} keyboard edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" appearance="filled" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <View style={styles.flex}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search places or paste a reel link"
            icon="search"
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search places or paste a reel link"
            testID="add-search"
          />
        </View>
      </View>

      <FlatList
        data={reelUrl ? [] : search.results}
        keyExtractor={(result) => result.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.shortcuts}>
            {reelUrl && (
              <Animated.View entering={FadeInDown.duration(motion.normal)}>
                <Shortcut
                  icon="logo-instagram"
                  title="Find the places in this reel"
                  subtitle={reelUrl}
                  highlight
                  onPress={() => navigation.replace('Share', { url: reelUrl })}
                />
              </Animated.View>
            )}
            {showShortcuts && (
              <Animated.View entering={FadeIn.duration(motion.normal)} style={styles.shortcutGroup}>
                {clipboardHasText && <Shortcut icon="clipboard-outline" title="Paste a reel link" subtitle="From Instagram's Share → Copy link" onPress={paste} />}
                <Shortcut
                  icon="pin"
                  title="Drop a pin on the map"
                  subtitle="For places without an address"
                  onPress={() => navigation.navigate('PickLocation', { initial: coords ?? undefined, mode: 'create' })}
                />
                <Shortcut icon="logo-instagram" title="Save straight from Instagram" subtitle="See how sharing works" onPress={() => navigation.navigate('ShareHelp')} />
              </Animated.View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(motion.fast)}>
            <SearchResultRow
              result={item}
              near={coords}
              units={settings.units}
              onPress={() =>
                navigation.navigate('EditPlace', {
                  draft: { name: item.name, address: item.address, category: item.category, latitude: item.latitude, longitude: item.longitude },
                })
              }
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
        ListFooterComponent={reelUrl ? null : <SearchStatus state={search} query={query} />}
      />
    </Screen>
  );
}

function Shortcut({ icon, title, subtitle, onPress, highlight }: { icon: IconName; title: string; subtitle?: string; onPress: () => void; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.shortcut, { backgroundColor: highlight ? colors.primarySoft : colors.surface }]}
      accessibilityLabel={title}
    >
      <View style={[styles.shortcutIcon, { backgroundColor: highlight ? colors.primary : colors.surfaceElevated }]}>
        <Ionicons name={icon} size={20} color={highlight ? colors.onPrimary : colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  shortcuts: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  shortcutGroup: { gap: spacing.sm },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg },
  shortcutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
});
