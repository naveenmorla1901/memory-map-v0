import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/LocationService';
import { LocationType } from '../../types/location';
import { formatDistance } from '../../utils/locationUtils';
import { savedLocationsStyles } from '../../styles/screens/SavedLocationsScreen.styles';
import { colors } from '../../styles/theme/colors';

const SavedLocationsScreen = ({ navigation }) => {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLocations = async () => {
    try {
      const savedLocations = await LocationService.getSavedLocations();
      setLocations(savedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  }, []);

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await LocationService.deleteLocation(locationId);
      setLocations(prevLocations => 
        prevLocations.filter(location => location.id !== locationId)
      );
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const renderLocationItem = ({ item }: { item: LocationType }) => (
    <TouchableOpacity 
      style={savedLocationsStyles.locationCard}
      onPress={() => navigation.navigate('Map', { location: item })}
    >
      <View style={savedLocationsStyles.locationInfo}>
        <View style={savedLocationsStyles.locationHeader}>
          <Text style={savedLocationsStyles.locationName}>{item.name}</Text>
          {item.isFavorite && (
            <Ionicons name="star" size={20} color="#FFD700" />
          )}
        </View>
        
        <Text style={savedLocationsStyles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
        
        <View style={savedLocationsStyles.locationMeta}>
          <Text style={savedLocationsStyles.categoryText}>
            {item.category || 'Uncategorized'}
          </Text>
          {item.distance !== undefined && (
            <Text style={savedLocationsStyles.distanceText}>
              {formatDistance(item.distance)}
            </Text>
          )}
        </View>

        {item.notes && (
          <Text style={savedLocationsStyles.notesText} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={savedLocationsStyles.deleteButton}
        onPress={() => handleDeleteLocation(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={savedLocationsStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={savedLocationsStyles.container}>
      <View style={savedLocationsStyles.header}>
        <Text style={savedLocationsStyles.title}>Saved Locations</Text>
      </View>

      {locations.length === 0 ? (
        <View style={savedLocationsStyles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color={colors.text.secondary} />
          <Text style={savedLocationsStyles.emptyText}>No saved locations yet</Text>
          <Text style={savedLocationsStyles.emptySubtext}>
            Your saved locations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={savedLocationsStyles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SavedLocationsScreen;