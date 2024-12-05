import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { SyncProvider } from './src/contexts/SyncContext';
import { LocationService } from './src/services/LocationService';

import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import MapScreen from './src/screens/main/MapScreen';
import SavedScreen from './src/screens/main/SavedScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import AddLocationScreen from './src/screens/main/AddLocationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF4B55',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string | undefined;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as keyof typeof Ionicons['glyphMap']} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStackScreen() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="AddLocation" component={AddLocationScreen} />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await LocationService.initDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading || !isDbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4B55" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SyncProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
            }}
          >
            {isAuthenticated === true ? (
              <Stack.Screen name="Main" component={MainStackScreen} />
            ) : (
              <>
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SyncProvider>
    </SafeAreaProvider>
  );
}
