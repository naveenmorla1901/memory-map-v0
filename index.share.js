import { AppRegistry } from 'react-native';

import ShareExtensionRoot from './src/share-extension/ShareExtensionRoot';

// IMPORTANT: the first argument to registerComponent must be "shareExtension"
AppRegistry.registerComponent('shareExtension', () => ShareExtensionRoot);
