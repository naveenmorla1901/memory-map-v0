import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Register both components
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('auth', () => App);

// Register with Expo
registerRootComponent(App);
