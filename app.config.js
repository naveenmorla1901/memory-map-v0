export default {
  name: 'MemoryMap',
  slug: 'memory-map',
  version: '1.0.0',
  orientation: 'portrait',
  // icon: './assets/icon.png',
  splash: {
    // image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.memorymap'
  },
  android: {
    adaptiveIcon: {
      // foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.yourcompany.memorymap'
  }
}