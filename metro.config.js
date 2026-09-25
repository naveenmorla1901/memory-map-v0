// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withShareExtension } = require('expo-share-extension/metro');

module.exports = withShareExtension(getDefaultConfig(__dirname));
