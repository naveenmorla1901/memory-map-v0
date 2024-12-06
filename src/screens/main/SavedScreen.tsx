//src/screens/main/SavedScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/LocationService';
import { Location as LocationType } from '../../types/location';
import SearchBar from '../../components/SearchBar';
import LocationField from '../../components/LocationField';
import * as ExpoLocation from 'expo-location';

export default function SavedScreen() {
  const [savedLocations, setSavedLocations] = useState<LocationType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadSavedLocations();
    getUserLocation();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const locations = await LocationService.getLocations();
      setSavedLocations(locations);
    } catch (error) {
      console.error('Error loading saved locations:', error);
      Alert.alert('Error', 'Failed to load saved locations. Please try again.');
    }
  };

  const getUserLocation = async () => {
    let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Unable to access location');
      return;
    }

    let location = await ExpoLocation.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredLocations = savedLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDistance = (
    userLoc: { latitude: number; longitude: number },
    savedLoc: LocationType
  ) => {
    const R = 6371;
    const deg2rad = (deg: number) => deg * (Math.PI / 180);
    const dLat = deg2rad(savedLoc.latitude - userLoc.latitude);
    const dLon = deg2rad(savedLoc.longitude - userLoc.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(userLoc.latitude)) * Math.cos(deg2rad(savedLoc.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedLocations = React.useMemo(() => {
    if (!userLocation || !filteredLocations || !Array.isArray(filteredLocations)) {
      return filteredLocations;
    }

    return [...filteredLocations].sort((a, b) => {
      const distanceA = calculateDistance(userLocation, a);
      const distanceB = calculateDistance(userLocation, b);
      return distanceA - distanceB;
    });
  }, [filteredLocations, userLocation]);

  const handleLocationPress = (location: LocationType) => {
    setSelectedLocation(location);
  };

  const handleFieldChange = (field: keyof LocationType, value: string) => {
    if (selectedLocation) {
      setSelectedLocation(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (selectedLocation) {
      try {
        await LocationService.updateLocation(selectedLocation);
        Alert.alert('Success', 'Location updated successfully!');
        loadSavedLocations();
        setSelectedLocation(null);
      } catch (error) {
        console.error('Error updating location:', error);
        Alert.alert('Error', 'Failed to update location. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedLocation) {
      try {
        await LocationService.deleteLocation(selectedLocation.id);
        Alert.alert('Success', 'Location deleted successfully!');
        loadSavedLocations();
        setSelectedLocation(null);
      } catch (error) {
        console.error('Error deleting location:', error);
        Alert.alert('Error', 'Failed to delete location. Please try again.');
      }
    }
  };

  const getLocationName = (location: LocationType) => {
    const parts = location.address.split(',');
    return parts[0] || location.name;
  };

  const renderItem = ({ item }: { item: LocationType }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleLocationPress(item)}>
      <View style={styles.itemContent}>
        {userLocation && (
          <Text style={styles.itemDistance}>
            {calculateDistance(userLocation, item).toFixed(1)} mi
          </Text>
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{getLocationName(item)}</Text>
          <Text style={styles.itemAddress}>{item.address}</Text>
        </View>
      </View>
      <Text style={styles.itemCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#FF4B55" />
        </TouchableOpacity>
      </View>
      <SearchBar 
        onSearch={handleSearch} 
        fetchSuggestions={async (query: string) => []}
        onOutsideClick={() => {}}
      />
      {savedLocations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No saved locations yet.</Text>
          <TouchableOpacity onPress={loadSavedLocations} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedLocations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshing={false}
          onRefresh={loadSavedLocations}
        />
      )}
      {selectedLocation && (
        <View style={styles.editContainer}>
          <LocationField
            location={selectedLocation}
            onFieldChange={handleFieldChange}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDistance: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    width: 50,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemAddress: {
    fontSize: 14,
    color: '#666',
  },
  itemCategory: {
    fontSize: 14,
    color: '#FF4B55',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#FF4B55',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

