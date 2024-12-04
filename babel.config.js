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
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@utils": "./src/utils",
            "@hooks": "./src/hooks",
            "@types": "./src/types",
            "@assets": "./assets"
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};

