import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

import { RootNavigator } from './src/navigation/RootNavigator';
import { setUpNotificationChannel } from './src/nearby/nearby';
import { AuthProvider } from './src/state/auth';
import { LocationProvider } from './src/state/location';
import { PlacesProvider } from './src/state/places';
import { SettingsProvider, useSettings } from './src/state/settings';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { ErrorBoundary } from './src/ui/ErrorBoundary';
import { ToastProvider } from './src/ui/Toast';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 250 });

if (Platform.OS !== 'web') {
  // Show nearby alerts even when the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  setUpNotificationChannel().catch(() => {});
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemedApp />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { settings } = useSettings();
  return (
    <ThemeProvider preference={settings.theme}>
      <ThemedStatusBar />
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <LocationProvider>
              <PlacesProvider>
                <RootNavigator />
              </PlacesProvider>
            </LocationProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
