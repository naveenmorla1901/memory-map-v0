import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/LocationService';
import { LocationType } from '../../types/location';
import { formatDistance } from '../../utils/locationUtils';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/NavigationTypes';

type SavedLocationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SavedLocations'>;

const SavedLocationsScreen = ({ navigation }: { navigation: SavedLocationsScreenNavigationProp }) => {
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
      style={styles.locationCard}
      onPress={() => navigation.navigate('MapScreen', { location: item })}
    >
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{item.name}</Text>
          {item.isFavorite && (
            <Ionicons name="star" size={20} color="#FFD700" />
          )}
        </View>
        
        <Text style={styles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
        
        <View style={styles.locationMeta}>
          <Text style={styles.categoryText}>
            {item.category || 'Uncategorized'}
          </Text>
          {item.distance !== undefined && (
            <Text style={styles.distanceText}>
              {item.distance} miles away
            </Text>
          )}
        </View>

        {item.notes.trim() !== '' && (
          <Text style={styles.notesText} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteLocation(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF4B55" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4B55" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
      </View>

      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No saved locations yet</Text>
          <Text style={styles.emptySubtext}>
            Your saved locations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={item => item.id || 'unknown-location'}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF4B55']}
              tintColor="#FF4B55"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  notesText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default SavedLocationsScreen;