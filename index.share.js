import { AppRegistry } from 'react-native';

import ShareExtensionRoot from './src/share/ShareExtensionRoot';

// iOS Share Extension entry point. The name must be "shareExtension".
AppRegistry.registerComponent('shareExtension', () => ShareExtensionRoot);
