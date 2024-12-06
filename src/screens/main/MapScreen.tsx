//src/screens/main/MapScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Switch, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LocationService } from '../../services/LocationService';
import { LocationInput } from '../../types/location';
import SearchBar from '../../components/SearchBar';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }: { navigation: any }) {
  const webViewRef = useRef<WebView>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInput | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [category, setCategory] = useState('');
  const searchBarHeight = useSharedValue(50);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const searchBarStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 20,
      left: 10,
      right: 10,
      zIndex: 1,
    };
  });

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Unable to access location');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  };

  const handleSearch = async (searchQuery: string) => {
    if (webViewRef.current && searchQuery) {
      webViewRef.current.injectJavaScript(`
        var geocoder = L.Control.Geocoder.nominatim();
        geocoder.geocode('${searchQuery}', function(results) {
          var r = results[0];
          if (r) {
            map.setView(r.center, 13);
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }
            currentMarker = L.marker(r.center, {
              icon: L.divIcon({
                className: 'custom-pin',
                html: '<div class="pin"></div><div class="pulse"></div>'
              })
            }).addTo(map);
            currentMarker.bindPopup(r.name).openPopup();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'location',
              name: r.name,
              latitude: r.center.lat,
              longitude: r.center.lng,
              address: r.name,
              category: 'Search Result'
            }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Location not found'
            }));
          }
        });
      `);
    }
  };

  const fetchSuggestions = async (query: string): Promise<string[]> => {
    if (query.length > 2) {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.map((item: any) => item.display_name).slice(0, 5);
    }
    return [];
  };

  const toggleSearchBar = () => {
    searchBarHeight.value = searchBarHeight.value === 0 ? 50 : 0;
  };

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'location') {
      setCurrentLocation({
        name: data.name.slice(0, 100),
        latitude: data.latitude,
        longitude: data.longitude,
        description: `Location at ${data.latitude}, ${data.longitude}`,
        address: data.address,
        category: data.category || 'Uncategorized'
      });
      setIsFavorite(false);
      setShowSavePopup(false);
    } else if (data.type === 'popupClick') {
      setShowSavePopup(true);
    } else if (data.type === 'error') {
      Alert.alert('Error', data.message);
    }
  };

  const saveLocation = async () => {
    if (currentLocation) {
      try {
        const locationToSave = {
          ...currentLocation,
          category: category || 'Uncategorized',
        };
        const locationId = await LocationService.saveLocation(locationToSave);
        Alert.alert('Success', 'Location saved successfully!');
        setCurrentLocation(null);
        setCategory('');
      } catch (error) {
        console.error('Error saving location:', error);
        Alert.alert('Error', 'Failed to save location. Please try again.');
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          #map { height: 100vh; width: 100%; }
          .custom-pin {
            width: 30px;
            height: 30px;
          }
          .pin {
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #FF4B55;
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -20px 0 0 -20px;
            animation-name: bounce;
            animation-fill-mode: both;
            animation-duration: 1s;
          }
          .pulse {
            background: rgba(255, 75, 85, 0.4);
            border-radius: 50%;
            height: 14px;
            width: 14px;
            position: absolute;
            left: 50%;
            top: 50%;
            margin: 11px 0px 0px -12px;
            transform: rotateX(55deg);
            z-index: -2;
          }
          .pulse:after {
            content: "";
            border-radius: 50%;
            height: 40px;
            width: 40px;
            position: absolute;
            margin: -13px 0 0 -13px;
            animation: pulsate 1s ease-out;
            animation-iteration-count: infinite;
            opacity: 0;
            box-shadow: 0 0 1px 2px #FF4B55;
            animation: pulsate 1s ease-out;
            animation-iteration-count: infinite;
            opacity: 0;
            box-shadow: 0 0 1px 2px #FF4B55;
          }
          @keyframes pulsate {
            0% {transform: scale(0.1, 0.1); opacity: 0;}
            50% {opacity: 1;}
            100% {transform: scale(1.2, 1.2); opacity: 0;}
          }
          @keyframes bounce {
            0% {opacity: 0; transform: translateY(-2000px) rotate(-45deg);}
            60% {opacity: 1; transform: translateY(30px) rotate(-45deg);}
            80% {transform: translateY(-10px) rotate(-45deg);}
            100% {transform: translateY(0) rotate(-45deg);}
          }
          .leaflet-left .leaflet-control {
            margin-left: 10px;
          }
          .leaflet-top.leaflet-left {
            top: 50%;
            transform: translateY(-50%);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false
          }).setView([51.505, -0.09], 13);
          L.control.zoom({
            position: 'topleft'
          }).addTo(map);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);

          var currentMarker = null;

          map.on('click', function(e) {
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }

            currentMarker = L.marker(e.latlng, {
              icon: L.divIcon({
                className: 'custom-pin',
                html: '<div class="pin"></div><div class="pulse"></div>'
              })
            }).addTo(map);

            var geocoder = L.Control.Geocoder.nominatim();
            geocoder.reverse(e.latlng, map.options.crs.scale(map.getZoom()), function(results) {
              var r = results[0];
              if (r) {
                currentMarker.bindPopup(r.name).openPopup();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'location',
                  name: r.name,
                  latitude: e.latlng.lat,
                  longitude: e.latlng.lng,
                  address: r.name,
                  category: 'Manual Pin'
                }));
              }
            });
          });
          map.on('popupopen', function(e) {
            var popup = e.popup;
            popup.getElement().addEventListener('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'popupClick',
              }));
            });
          });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <Reanimated.View style={searchBarStyle}>
        <SearchBar onSearch={handleSearch} fetchSuggestions={fetchSuggestions} onOutsideClick={() => setSuggestions([])} />
      </Reanimated.View>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        onMessage={handleMessage}
      />
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('AddLocation')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      {currentLocation && showSavePopup && (
        <View style={styles.locationInfoContainer}>
          <Text style={styles.locationName}>{currentLocation.name}</Text>
          <Text style={styles.locationCategory}>{currentLocation.category}</Text>
          {userLocation && (
            <Text style={styles.locationDistance}>
              {calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                currentLocation.latitude,
                currentLocation.longitude
              ).toFixed(2)} miles away
            </Text>
          )}
          <View style={styles.favoriteContainer}>
            <Text style={styles.favoriteLabel}>Favorite</Text>
            <Switch
              value={isFavorite}
              onValueChange={setIsFavorite}
              trackColor={{ false: "#767577", true: "#FF4B55" }}
              thumbColor={isFavorite ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <TextInput
              style={styles.categoryInput}
              value={category}
              onChangeText={setCategory}
              placeholder="Enter category"
            />
          </View>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveLocation}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  map: {
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF4B55',
    padding: 15,
    borderRadius: 30,
  },
  searchToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF4B55',
    padding: 10,
    borderRadius: 20,
  },
  locationInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  locationDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  favoriteLabel: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF4B55',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});

