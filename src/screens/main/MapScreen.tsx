import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import LocationForm from '../../components/LocationForm';
import { LocationService } from '../../services/LocationService';
import { LocationType } from '../../types/location';
import { calculateDistance } from '../../utils/locationUtils';
import { styles } from '../../styles/screens/MapScreen.styles';
import { mapHtml } from '../../styles/screens/mapHtml';
import { useLocationPermission } from '../../hooks/useLocationPermission';

const MapScreen = ({ navigation }: { navigation: any }) => {
  const webViewRef = useRef<WebView>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  const { location: userLocation, loading: locationLoading, error: locationError, requestAndGetLocation } = useLocationPermission();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedLocations();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (isMapReady && userLocation) {
      centerMapOnLocation(userLocation.latitude, userLocation.longitude);
    }
  }, [isMapReady, userLocation]);

  const loadSavedLocations = async () => {
    try {
      const locations = await LocationService.getSavedLocations();
      if (locations.length > 0 && webViewRef.current) {
        const script = locations.map((loc: LocationType) => `
          L.marker([${loc.coordinates.latitude}, ${loc.coordinates.longitude}])
            .bindPopup("${loc.name}")
            .addTo(window.map);
        `).join('');
        webViewRef.current.injectJavaScript(script + 'true;');
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4`
      );
      const data = await response.json();

      const suggestions = data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }));

      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Search error:', error);
      setSearchSuggestions([]);
    }
  };

  const handleSelectLocation = (location: any) => {
    if (webViewRef.current) {
      const script = `
        try {
          if (window.map) {
            if (window.searchMarker) {
              window.map.removeLayer(window.searchMarker);
            }
            window.map.setView([${location.latitude}, ${location.longitude}], 15);
            window.searchMarker = L.marker([${location.latitude}, ${location.longitude}])
              .bindPopup("${location.name}")
              .addTo(window.map)
              .openPopup();
          }
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Search error: ' + e.toString()
          }));
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message:', data);

      switch (data.type) {
        case 'mapReady':
          setIsMapReady(true);
          setIsMapLoading(false);
          break;

        case 'error':
          console.error('Map error:', data.message);
          Alert.alert('Map Error', data.message);
          break;

        case 'locationSelected':
          // Just update the marker, don't show save form
          break;

        case 'saveLocation':
          // Now we show the save form only when the save button is clicked
          handleLocationSelected(data);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  const handleLocationSelected = async (data: any) => {
    const { latitude, longitude, address } = data;
    const distance = userLocation ? calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      latitude,
      longitude
    ) : null;

    setCurrentLocation({
      id: 'temp-' + Date.now().toString(),
      name: address?.split(',')[0] || 'Selected Location',
      description: `Location at ${latitude}, ${longitude}`,
      category: 'Uncategorized',
      address: address || '',
      coordinates: { latitude, longitude },
      distance: distance,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isInstagramSource: false,
      isFavorite: false,
      notifyEnabled: false,
      notifyRadius: 1.0,
      notes: ''
    });
    setShowSavePopup(true);
  };

  const handleLocateMe = async () => {
    try {
      await requestAndGetLocation();
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const centerMapOnLocation = (latitude: number, longitude: number) => {
    if (!webViewRef.current) return;

    const script = `
      try {
        if (window.map) {
          window.map.setView([${latitude}, ${longitude}], 15);
          if (window.userMarker) {
            window.map.removeLayer(window.userMarker);
          }
          window.userMarker = L.marker([${latitude}, ${longitude}], {
            icon: L.divIcon({
              className: 'user-dot',
              iconSize: [20, 20]
            })
          }).addTo(window.map);
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Error centering map: ' + e.toString()
        }));
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  };

  const handleSaveLocation = async (locationData: LocationType) => {
    try {
      await LocationService.saveLocation(locationData);
      setShowSavePopup(false);
      setCurrentLocation(null);
      Alert.alert('Success', 'Location saved successfully!');
      loadSavedLocations(); // Refresh markers on map
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar 
          onSearch={handleSearch}
          onSelectLocation={handleSelectLocation}
          suggestions={searchSuggestions}
          placeholder="Search locations..."
        />
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={handleMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        
        {isMapLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4B55" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => {
          webViewRef.current?.injectJavaScript('window.map.zoomIn();true;');
        }}>
          <Ionicons name="add" size={24} color="#FF4B55" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => {
          webViewRef.current?.injectJavaScript('window.map.zoomOut();true;');
        }}>
          <Ionicons name="remove" size={24} color="#FF4B55" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.locateButton}
        onPress={handleLocateMe}
      >
        <Ionicons name="locate" size={24} color="#FF4B55" />
      </TouchableOpacity>

      {showSavePopup && currentLocation && (
        <LocationForm
          initialData={currentLocation}
          onSave={handleSaveLocation}
          onClose={() => setShowSavePopup(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default MapScreen;