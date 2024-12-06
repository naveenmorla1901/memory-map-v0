import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Initialize Firebase and auth first
import './src/utils/firebaseConfig';

// Register both components
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('auth', () => App);

// Register root component for Expo
registerRootComponent(App);
