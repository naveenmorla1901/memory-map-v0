import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Memory Map',
  slug: 'memory-map',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.memorymap.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.memorymap.app',
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET'
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow Memory Map to use your location.'
      }
    ],
    [
      'expo-build-properties',
      {
        // Lets the app talk to a local (http, not https) Django dev server.
        android: {
          usesCleartextTraffic: true
        }
      }
    ]
  ],
  extra: {
    // Base URL of the Django backend's REST API. Override with the API_URL
    // env var - the default only works from the Android emulator.
    apiUrl: process.env.API_URL || 'http://10.0.2.2:8002/api/v1'
  }
}

export default config;