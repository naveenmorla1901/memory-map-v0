import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationState {
  location: {
    latitude: number;
    longitude: number;
  } | null;
  error: string | null;
  loading: boolean;
}

export const useLocationPermission = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    loading: true
  });

  const requestAndGetLocation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Request permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setState({
          location: null,
          error: 'Permission to access location was denied',
          loading: false
        });
        Alert.alert(
          'Location Permission Required',
          'This app needs access to your location to show nearby places. Please enable location services in your settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setState({
          location: null,
          error: 'Location services are disabled',
          loading: false
        });
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Platform.select({
          ios: Location.Accuracy.BestForNavigation,
          android: Location.Accuracy.High
        })
      });

      setState({
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        error: null,
        loading: false
      });

    } catch (error) {
      console.error('Location Error:', error);
      setState({
        location: null,
        error: 'Error getting location',
        loading: false
      });
    }
  }, []);

  const startLocationUpdates = useCallback(async () => {
    if (state.error || !state.location) {
      return;
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Platform.select({
            ios: Location.Accuracy.BestForNavigation,
            android: Location.Accuracy.High
          }),
          timeInterval: 10000,
          distanceInterval: 10
        },
        (location) => {
          setState(prev => ({
            ...prev,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          }));
        }
      );

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Watch position error:', error);
    }
  }, [state.error, state.location]);

  useEffect(() => {
    requestAndGetLocation();
  }, [requestAndGetLocation]);

  return {
    ...state,
    requestAndGetLocation,
    startLocationUpdates
  };
};