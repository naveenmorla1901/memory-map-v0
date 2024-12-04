import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const MapScreen = ({ navigation }: { navigation: any }) => {
  const webViewRef = useRef<WebView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBarHeight = useSharedValue(0);

  const searchBarStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(searchBarHeight.value),
      opacity: searchBarHeight.value > 0 ? withSpring(1) : withSpring(0),
    };
  });

  const handleSearch = () => {
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
          }
        });
      `);
    }
  };

  const toggleSearchBar = () => {
    searchBarHeight.value = searchBarHeight.value === 0 ? 50 : 0;
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
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .custom-pin { width: 30px; height: 30px; }
          .pin {
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #FF4B55;
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -15px 0 0 -15px;
            animation-name: bounce;
            animation-duration: 1s;
            animation-iteration-count: infinite;
          }
          .pulse {
            background: rgba(255, 75, 85, 0.3);
            border-radius: 50%;
            height: 14px;
            width: 14px;
            position: absolute;
            left: 50%;
            top: 50%;
            margin: -7px 0 0 -7px;
            transform: rotateX(55deg);
            z-index: -2;
          }
          @keyframes bounce {
            0% { transform: rotate(-45deg) translate(0, 0); }
            50% { transform: rotate(-45deg) translate(0, -10px); }
            100% { transform: rotate(-45deg) translate(0, 0); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([0, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap contributors'
          }).addTo(map);

          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var lat = position.coords.latitude;
              var lon = position.coords.longitude;
              map.setView([lat, lon], 13);
            });
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.searchButton} onPress={toggleSearchBar}>
        <Ionicons name="search" size={24} color="#FF4B55" />
      </TouchableOpacity>
      
      <Animated.View style={[styles.searchBar, searchBarStyle]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </Animated.View>

      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  searchButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 70,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  searchInput: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
  },
});

export default MapScreen;
