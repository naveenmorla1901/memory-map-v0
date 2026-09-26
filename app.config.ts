import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Set these per build (e.g. in eas.json profiles or your shell):
 *   APP_BUNDLE_ID          your reverse-DNS id, e.g. com.yourname.memorymap
 *   EXPO_PUBLIC_API_URL    the backend, e.g. https://api.memorymap.app
 *   APP_ENV                "production" disables plain-http (dev server) traffic
 *   EAS_PROJECT_ID         from `eas init`
 */
const BUNDLE_ID = process.env.APP_BUNDLE_ID || 'com.memorymap.app';
const IS_PRODUCTION = process.env.APP_ENV === 'production';
const APP_GROUP = `group.${BUNDLE_ID}`;

const LOCATION_WHEN_IN_USE = 'Memory Map shows where you are on the map and sorts your saved places by distance.';
const LOCATION_ALWAYS =
  "If you turn on nearby alerts, Memory Map lets you know when you're close to a place you saved - even when the app is closed. Your location stays on your phone.";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Memory Map',
  slug: 'memory-map',
  version: '1.0.0',
  scheme: 'memorymap',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: '1',
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      AppGroup: APP_GROUP,
      NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE,
      NSLocationAlwaysAndWhenInUseUsageDescription: LOCATION_ALWAYS,
      LSApplicationQueriesSchemes: ['instagram', 'comgooglemaps'],
    },
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeName',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUserContent',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          // Search results are biased toward a rounded location.
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCoarseLocation',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
      ],
    },
  },

  android: {
    package: BUNDLE_ID,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#FF5E52',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'POST_NOTIFICATIONS', 'VIBRATE'],
    // Pulled in by libraries but unused: geofencing needs no foreground
    // service, and every extra permission means more Play Store review.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      // No biometric-locked storage and no remote push (alerts are local).
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'com.google.android.c2dm.permission.RECEIVE',
    ],
  },

  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 150,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0D0D10' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_WHEN_IN_USE,
        locationAlwaysAndWhenInUsePermission: LOCATION_ALWAYS,
        locationAlwaysPermission: LOCATION_ALWAYS,
        isAndroidBackgroundLocationEnabled: true,
        // Geofencing relaunches the app on region entry by itself; the iOS
        // "location" background mode isn't needed.
        isIosBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#FF4B55',
      },
    ],
    '@maplibre/maplibre-react-native',
    [
      'expo-build-properties',
      {
        // Plain http is only for talking to a dev server on your LAN.
        android: { usesCleartextTraffic: !IS_PRODUCTION },
        ios: IS_PRODUCTION ? {} : { networkInspector: true },
      },
    ],
    [
      // iOS: "Memory Map" in the share sheet opens a small sheet over
      // Instagram (src/share/ShareExtensionRoot.tsx).
      'expo-share-extension',
      {
        activationRules: [
          { type: 'url', max: 1 },
          { type: 'text', max: 1 },
        ],
        backgroundColor: { red: 0, green: 0, blue: 0, alpha: 0 },
        height: 620,
        excludedPackages: [
          'expo-dev-client',
          'expo-splash-screen',
          'expo-updates',
          'expo-location',
          'expo-task-manager',
          'expo-notifications',
        ],
      },
    ],
    // Android: the same overlay, as a translucent activity over Instagram.
    './plugins/withAndroidShareOverlay',
    './plugins/withIosShareExtensionPolish',
  ],

  experiments: { typedRoutes: false },

  extra: {
    iosAppGroup: APP_GROUP,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
