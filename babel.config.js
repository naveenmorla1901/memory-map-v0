module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@utils": "./src/utils",
            "@components": "./src/components",
            "@navigation": "./src/navigation",
            "@types": "./src/types",
            "@assets": "./assets"
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
