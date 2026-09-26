import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

import { NearbyManager } from '../nearby/NearbyManager';
import { AddPlaceScreen } from '../screens/places/AddPlaceScreen';
import { EditPlaceScreen } from '../screens/places/EditPlaceScreen';
import { PickLocationScreen } from '../screens/places/PickLocationScreen';
import { PlaceDetailScreen } from '../screens/places/PlaceDetailScreen';
import { PlacesScreen } from '../screens/places/PlacesScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { DeleteAccountScreen } from '../screens/profile/DeleteAccountScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { ShareHelpScreen } from '../screens/share/ShareHelpScreen';
import { ShareScreen } from '../screens/share/ShareScreen';
import { useAuth } from '../state/auth';
import { pendingShare } from '../state/pendingShare';
import { useSettings } from '../state/settings';
import { useTheme } from '../theme/ThemeProvider';
import { OfflineBanner } from '../ui/OfflineBanner';
import { extractInstagramUrl } from '../utils/instagram';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="Map" component={MapScreen} />
      <Tabs.Screen name="Places" component={PlacesScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

type Link = { kind: 'share'; url: string } | { kind: 'place'; id: string } | { kind: 'map' };

/** memorymap://share?url=…, memorymap://place/<id>, memorymap://map */
export function parseLink(url: string): Link | null {
  const { hostname, path, queryParams } = Linking.parse(url);
  const segments = [hostname, ...(path ?? '').split('/')].filter(Boolean) as string[];
  if (segments[0] === 'share') {
    const shared = extractInstagramUrl(typeof queryParams?.url === 'string' ? queryParams.url : '');
    return shared ? { kind: 'share', url: shared } : null;
  }
  if (segments[0] === 'place' && segments[1]) return { kind: 'place', id: segments[1] };
  if (segments[0] === 'map') return { kind: 'map' };
  return null;
}

export function RootNavigator() {
  const { status } = useAuth();
  const { loaded } = useSettings();
  const { colors, isDark } = useTheme();
  const queued = useRef<Link | null>(null);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.background, text: colors.text, border: colors.separator },
    };
  }, [colors, isDark]);

  const statusRef = useRef(status);
  statusRef.current = status;

  // Stable across renders (reads status from a ref), so the listeners below
  // subscribe once and the launch URL is handled exactly once.
  const open = useCallback((link: Link, attempt = 0) => {
    if (statusRef.current !== 'signedIn') {
      if (link.kind === 'share') pendingShare.set(link.url);
      else queued.current = link;
      return;
    }
    if (!navigationRef.isReady()) {
      if (attempt < 20) setTimeout(() => open(link, attempt + 1), 100);
      return;
    }
    if (link.kind === 'share') navigationRef.navigate('Share', { url: link.url });
    if (link.kind === 'place') navigationRef.navigate('PlaceDetail', { placeId: link.id });
    if (link.kind === 'map') navigationRef.navigate('Tabs', { screen: 'Map' });
  }, []);

  // Deep links (share extension hand-off, "Open Memory Map" from the overlay).
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const link = parseLink(url);
      if (link) open(link);
    });
    Linking.getInitialURL().then((url) => {
      const link = url ? parseLink(url) : null;
      if (link) open(link);
    });
    return () => subscription.remove();
  }, [open]);

  // Tapping a nearby-alert notification.
  useEffect(() => {
    const openFromNotification = (response: Notifications.NotificationResponse | null) => {
      const placeId = response?.notification.request.content.data?.placeId;
      if (typeof placeId === 'string') open({ kind: 'place', id: placeId });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    Notifications.getLastNotificationResponseAsync().then(openFromNotification).catch(() => {});
    return () => subscription.remove();
  }, [open]);

  // Just signed in: continue whatever brought the user here.
  useEffect(() => {
    if (status !== 'signedIn') return;
    const timer = setTimeout(() => {
      const shared = pendingShare.take();
      if (shared) open({ kind: 'share', url: shared });
      else if (queued.current) {
        const link = queued.current;
        queued.current = null;
        open(link);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [status, open]);

  const ready = status !== 'loading' && loaded;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {status === 'signedIn' ? (
          <Stack.Group>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
            <Stack.Screen name="PickLocation" component={PickLocationScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="EditPlace" component={EditPlaceScreen} />
              <Stack.Screen name="Share" component={ShareScreen} options={{ gestureEnabled: false }} />
              <Stack.Screen name="ShareHelp" component={ShareHelpScreen} />
            </Stack.Group>
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
      {status === 'signedIn' && <NearbyManager />}
      <OfflineBanner />
    </NavigationContainer>
  );
}
