import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/main/MapScreen';
import SavedLocationsScreen from '../screens/main/SavedLocationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF4B55',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedLocationsScreen}
        options={{
          headerTitle: 'Saved Locations'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerTitle: 'My Profile'
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;