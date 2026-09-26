import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootScreenProps } from '../../navigation/types';
import { ShareFlow } from '../../share/ShareFlow';
import { useUserLocation } from '../../state/location';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { useTheme } from '../../theme/ThemeProvider';
import { searchBias } from '../../utils/geo';

/** In-app version of the share flow (deep links, pasted links, the Android fallback). */
export function ShareScreen({ navigation, route }: RootScreenProps<'Share'>) {
  const { colors } = useTheme();
  const { coords } = useUserLocation();
  const { settings } = useSettings();
  const { places, refresh } = usePlaces();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ShareFlow
        url={route.params.url}
        near={searchBias(coords, places)}
        here={coords}
        units={settings.units}
        onClose={() => navigation.goBack()}
        onSaved={() => refresh()}
        savedAction={{
          title: 'View on map',
          onPress: (places) => navigation.navigate('Tabs', { screen: 'Map', params: { focusPlaceId: places[0]?.id } }),
        }}
      />
    </SafeAreaView>
  );
}
