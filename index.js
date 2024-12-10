import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Initialize Firebase and auth first
import './src/utils/firebaseConfig';

// Determine the app name
const APP_NAME = 'memorymap';

try {
  // Register components
  AppRegistry.registerComponent(APP_NAME, () => App);
  
  // For Expo
  registerRootComponent(App);
} catch (error) {
  console.error('Failed to register app components:', error);
  throw error;
}
