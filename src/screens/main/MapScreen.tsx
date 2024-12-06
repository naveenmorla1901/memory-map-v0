import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LocationService } from '../../services/LocationService';

export default function MapScreen({ navigation }: { navigation: any }) {
  const webViewRef = useRef<WebView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const searchBarHeight = useSharedValue(0);

  const searchBarStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(searchBarHeight.value),
      opacity: searchBarHeight.value > 0 ? withSpring(1) : withSpring(0),
    };
  });

  const handleSearch = async () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        var geocoder = L.Control.Geocoder.nominatim();
        geocoder.geocode('${searchQuery}', function(results) {
          var r = results[0];
          if (r) {
            map.setView(r.center, 13);
            L.marker(r.center, {
              icon: L.divIcon({
                className: 'custom-pin',
                html: '<div class="pin"></div><div class="pulse"></div>'
              })
            }).addTo(map).bindPopup(r.name).openPopup();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'location',
              name: r.name,
              latitude: r.center.lat,
              longitude: r.center.lng
            }));
          }
        });
      `);
    }
  };

  const toggleSearchBar = () => {
    searchBarHeight.value = searchBarHeight.value === 0 ? 50 : 0;
  };

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'location') {
      setCurrentLocation({
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude
      });
    }
  };

  const saveLocation = async () => {
    if (currentLocation) {
      try {
        await LocationService.saveLocation(currentLocation);
        Alert.alert('Success', 'Location saved successfully!');
      } catch (error) {
        console.error('Error saving location:', error);
        Alert.alert('Error', 'Failed to save location. Please try again.');
      }
    }
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
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([51.505, -0.09], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <Reanimated.View style={[styles.searchContainer, searchBarStyle]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
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
      <TouchableOpacity 
        style={styles.searchToggle} 
        onPress={toggleSearchBar}
      >
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
      {currentLocation && (
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveLocation}
        >
          <Ionicons name="bookmark" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#FF4B55',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    borderRadius: 5,
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
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FF4B55',
    padding: 15,
    borderRadius: 30,
  },
});

