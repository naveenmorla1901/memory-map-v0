import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Initialize Firebase auth
import './src/utils/firebaseConfig';

// Register components
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('auth', () => App);

// Register with Expo
registerRootComponent(App);

export default App;