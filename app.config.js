export default {
  name: 'Memory Map',
  slug: 'memory-map',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.memorymap.app'
  },
  android: {
    package: 'com.memorymap.app',
    adaptiveIcon: {
      backgroundColor: '#ffffff'
    }
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true
        }
      }
    ]
  ]
};