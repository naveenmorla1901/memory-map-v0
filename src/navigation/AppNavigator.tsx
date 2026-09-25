import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useShareIntentContext } from 'expo-share-intent';
import { authService } from '../services/AuthService';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ShareReviewScreen from '../screens/main/ShareReviewScreen';
import BottomTabNavigator from './BottomTabNavigator';
import { navigationRef } from './navigationRef';
import { extractInstagramUrl } from '../utils/instagramUrl';

const Stack = createNativeStackNavigator();

// The iOS Share Extension hands off to the main app via openHostApp(), which
// deep-links to memorymap://share?url=... - this maps that to the ShareReview
// screen. Android's equivalent (expo-share-intent's useShareIntentContext) is
// handled imperatively below instead, since it's a JS event, not a URL.
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      ShareReview: 'share',
    },
  },
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    let isMounted = true;

    authService.bootstrap().then((user) => {
      if (isMounted) {
        setIsAuthenticated(!!user);
        setIsLoading(false);
      }
    });

    const unsubscribe = authService.subscribe((user) => {
      setIsAuthenticated(!!user);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Android: a share-target launch surfaces here as a share intent rather
  // than a deep link. iOS is handled separately via the `linking` config
  // above, since expo-share-extension's openHostApp() uses a real URL.
  useEffect(() => {
    if (Platform.OS !== 'android' || !hasShareIntent || !isAuthenticated) return;

    const url = extractInstagramUrl(shareIntent.text) || extractInstagramUrl(shareIntent.webUrl);
    if (url && navigationRef.isReady()) {
      navigationRef.navigate('ShareReview', { url });
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4B55" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen
              name="ShareReview"
              component={ShareReviewScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
