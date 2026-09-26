import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { authApi } from '../../api/endpoints';
import { LINKS } from '../../config';
import type { TabScreenProps } from '../../navigation/types';
import { enableNearbyAlerts, stopNearbyAlerts } from '../../nearby/nearby';
import { useAuth } from '../../state/auth';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, radii, spacing } from '../../theme/tokens';
import { Row, Section } from '../../ui/List';
import { Screen } from '../../ui/Screen';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Text } from '../../ui/Text';
import { useToast } from '../../ui/Toast';
import { initials } from '../../utils/format';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { colors } = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { places } = usePlaces();
  const { settings, update } = useSettings();

  const stats = useMemo(
    () => [
      { label: 'Places', value: places.length },
      { label: 'Visited', value: places.filter((place) => place.visited).length },
      { label: 'Favorites', value: places.filter((place) => place.is_favorite).length },
      { label: 'From reels', value: places.filter((place) => place.source === 'instagram').length },
    ],
    [places],
  );

  if (!user) return null;

  const memberSince = new Date(user.date_joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const version = `${Application.nativeApplicationVersion ?? '1.0.0'}${Application.nativeBuildVersion ? ` (${Application.nativeBuildVersion})` : ''}`;

  const toggleNearby = async (enabled: boolean) => {
    if (!enabled) {
      update({ nearbyAlerts: false });
      stopNearbyAlerts();
      return;
    }
    const result = await enableNearbyAlerts();
    if (result.ok) {
      update({ nearbyAlerts: true });
      toast({ kind: 'success', message: 'Nearby alerts are on. Turn them on for a place from its page.' });
    } else {
      toast({ kind: 'info', message: result.message, action: { label: 'Settings', onPress: () => Linking.openSettings() } });
    }
  };

  const signOut = () =>
    Alert.alert('Sign out?', 'Your places stay saved to your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => authApi.signOut() },
    ]);

  const openLink = (url: string) => WebBrowser.openBrowserAsync(url, { controlsColor: colors.primary });

  return (
    <Screen scroll padded={false} edges={['top']}>
      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(motion.normal)} style={styles.identity}>
          <LinearGradient colors={[colors.primary, '#FF8A5B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text variant="title" style={styles.avatarText}>
              {initials(user.name, user.email)}
            </Text>
          </LinearGradient>
          <View style={styles.flex}>
            <Text variant="heading" numberOfLines={1}>
              {user.name || user.email}
            </Text>
            <Text variant="callout" color="textSecondary" numberOfLines={1}>
              {user.email}
            </Text>
            <Text variant="caption" color="textTertiary">
              Member since {memberSince}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(motion.normal)} style={[styles.stats, { backgroundColor: colors.surface }]}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[styles.stat, index > 0 && { borderLeftColor: colors.separator, borderLeftWidth: StyleSheet.hairlineWidth }]} accessible accessibilityLabel={`${stat.value} ${stat.label}`}>
              <Text variant="heading">{stat.value.toLocaleString()}</Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {stat.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(motion.normal)} style={styles.sections}>
          <Section title="Account">
            <Row title="Edit profile" icon="person-circle-outline" onPress={() => navigation.navigate('EditProfile')} />
            <Row title="Change password" icon="key-outline" onPress={() => navigation.navigate('ChangePassword')} />
          </Section>

          <Section title="Preferences" footer="Nearby alerts check your location on this phone only - it's never sent to our servers.">
            <View style={styles.preference}>
              <Text variant="body">Appearance</Text>
              <SegmentedControl
                accessibilityLabel="Appearance"
                value={settings.theme}
                onChange={(theme) => update({ theme })}
                options={[
                  { value: 'system', label: 'Auto' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </View>
            <View style={styles.preference}>
              <Text variant="body">Distances</Text>
              <SegmentedControl
                accessibilityLabel="Distance units"
                value={settings.units}
                onChange={(units) => update({ units })}
                options={[
                  { value: 'km', label: 'Kilometers' },
                  { value: 'mi', label: 'Miles' },
                ]}
              />
            </View>
            <Row title="Nearby alerts" subtitle="A heads-up when you're close to a saved place" icon="notifications-outline" toggle={{ value: settings.nearbyAlerts, onChange: toggleNearby }} />
          </Section>

          <Section title="Help">
            <Row title="Save places from Instagram" icon="logo-instagram" onPress={() => navigation.navigate('ShareHelp')} />
            {!!LINKS.support && <Row title="Contact support" icon="mail-outline" onPress={() => Linking.openURL(`mailto:${LINKS.support}?subject=Memory%20Map%20${version}`)} />}
          </Section>

          <Section title="About">
            <Row title="Privacy policy" icon="shield-checkmark-outline" onPress={() => openLink(LINKS.privacy)} />
            <Row title="Terms of use" icon="document-text-outline" onPress={() => openLink(LINKS.terms)} />
            <Row title="Map data" subtitle="© OpenStreetMap contributors, OpenFreeMap" icon="map-outline" onPress={() => openLink('https://www.openstreetmap.org/copyright')} />
          </Section>

          <Section>
            <Row title="Sign out" icon="log-out-outline" onPress={signOut} chevron={false} testID="profile-sign-out" />
            <Row title="Delete account" icon="trash-outline" destructive onPress={() => navigation.navigate('DeleteAccount')} />
          </Section>

          <Text variant="caption" color="textTertiary" align="center">
            Memory Map {version}
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: spacing.xl, gap: spacing.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF' },
  stats: { flexDirection: 'row', borderRadius: radii.lg, paddingVertical: spacing.lg },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs },
  sections: { gap: spacing.xl },
  preference: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
});
