import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShareIntentProvider } from 'expo-share-intent';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ShareIntentProvider>
        <AppNavigator />
      </ShareIntentProvider>
    </SafeAreaProvider>
  );
}