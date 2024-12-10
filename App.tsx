// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens with explicit default imports
import SignInScreen from '@screens/auth/SignInScreen';
import SignUpScreen from '@screens/auth/SignUpScreen';
import MapScreen from '@screens/main/MapScreen';
import SavedScreen from '@screens/main/SavedScreen';
import ProfileScreen from '@screens/main/ProfileScreen';

// Import services
import { LocationService } from './src/services/LocationService';

// Ensure Firebase is initialized
import '@utils/firebaseConfig';

type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  MainTabs: undefined;
};

type MainTabParamList = {
  Map: undefined;
  Saved: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Initialize database
    try {
      LocationService.initializeDatabase();
    } catch (error) {
      console.error('Database initialization error:', error);
      Alert.alert('Database Error', 'Failed to initialize database');
    }

    // Check network connection
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isInternetReachable || false);
    });

    // Set up auth state listener
    const unsubscribeAuth = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No Internet Connection</Text>
        <Text>Please check your connection and try again</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
        >
          {user ? (
            // User is signed in
            <Stack.Screen name="MainTabs" component={MainTabs} />
          ) : (
            // No user is signed in
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}