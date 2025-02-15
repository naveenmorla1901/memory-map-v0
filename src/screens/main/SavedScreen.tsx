import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/LocationService';
import { LocationType } from '../../types/location';
import SearchBar from '../../components/SearchBar';
import LocationField from '../../components/LocationField';
import * as ExpoLocation from 'expo-location';
import { savedScreenStyles } from '../../styles/screens/SavedScreen.styles';
import { colors } from '../../styles/theme/colors';

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
      const locations = await LocationService.getSavedLocations();
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
    const dLat = deg2rad(savedLoc.coordinates.latitude - userLoc.latitude);
    const dLon = deg2rad(savedLoc.coordinates.longitude - userLoc.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(userLoc.latitude)) * Math.cos(deg2rad(savedLoc.coordinates.latitude)) *
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
        ...prev,
        [field]: value
      } as LocationType));
    }
  };

  const handleSave = async () => {
    if (selectedLocation) {
      try {
        await LocationService.updateLocation(selectedLocation.id, selectedLocation);
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
    <TouchableOpacity style={savedScreenStyles.item} onPress={() => handleLocationPress(item)}>
      <View style={savedScreenStyles.itemContent}>
        {userLocation && (
          <Text style={savedScreenStyles.itemDistance}>
            {calculateDistance(userLocation, item).toFixed(1)} mi
          </Text>
        )}
        <View style={savedScreenStyles.itemDetails}>
          <Text style={savedScreenStyles.itemName}>{getLocationName(item)}</Text>
          <Text style={savedScreenStyles.itemAddress}>{item.address}</Text>
        </View>
      </View>
      <Text style={savedScreenStyles.itemCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={savedScreenStyles.container}>
      <View style={savedScreenStyles.header}>
        <Text style={savedScreenStyles.title}>Saved Locations</Text>
        <TouchableOpacity style={savedScreenStyles.filterButton}>
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search saved locations"
      />
      {savedLocations.length === 0 ? (
        <View style={savedScreenStyles.emptyState}>
          <Text style={savedScreenStyles.emptyStateText}>No saved locations yet.</Text>
          <TouchableOpacity onPress={loadSavedLocations} style={savedScreenStyles.refreshButton}>
            <Text style={savedScreenStyles.refreshButtonText}>Refresh</Text>
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
        <View style={savedScreenStyles.editContainer}>
          <LocationField
            location={selectedLocation}
            onFieldChange={handleFieldChange}
          />
          <View style={savedScreenStyles.editButtons}>
            <TouchableOpacity style={savedScreenStyles.saveButton} onPress={handleSave}>
              <Text style={savedScreenStyles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={savedScreenStyles.deleteButton} onPress={handleDelete}>
              <Text style={savedScreenStyles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
