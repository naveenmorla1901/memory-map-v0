import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';

// Defines the background geofencing task. It must be registered when the JS
// bundle loads, because the OS can start the app headless just to run it.
import './src/nearby/nearby';
import App from './App';
import ShareOverlayRoot from './src/share/ShareOverlayRoot';

registerRootComponent(App);

// Android "Share to Memory Map" overlay (see plugins/withAndroidShareOverlay.js).
AppRegistry.registerComponent('shareOverlay', () => ShareOverlayRoot);
