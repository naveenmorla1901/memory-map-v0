import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../services/LocationService';
import type { Location } from '../../services/LocationService';
import { useSyncContext } from '../../contexts/SyncContext';

interface RenderItemProps {
  item: Location;
}

export default function SavedScreen() {
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const { startSync, isSyncing, isOnline, syncError } = useSyncContext();

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (syncError) {
      Alert.alert('Sync Error', syncError);
    }
  }, [syncError]);

  const loadSavedLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const locations = await LocationService.getLocations();
      setSavedLocations(locations);
      
      // Start sync after loading local data
      if (isOnline) {
        startSync();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load locations';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (locationId: string) => {
    try {
      const location = savedLocations.find(loc => loc.id === locationId);
      if (!location) return;

      const newFavoriteStatus = !location.isFavorite;
      
      // Update UI immediately for better UX
      const updatedLocations = savedLocations.map(loc => 
        loc.id === locationId ? { ...loc, isFavorite: newFavoriteStatus } : loc
      );
      setSavedLocations(updatedLocations);

      // Update in database
      await LocationService.updateFavoriteStatus(locationId, newFavoriteStatus);
    } catch (error) {
      // Revert UI change if database update fails
      const updatedLocations = savedLocations.map(loc => 
        loc.id === locationId ? { ...loc, isFavorite: !loc.isFavorite } : loc
      );
      setSavedLocations(updatedLocations);
      
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const filteredLocations = savedLocations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (!showOnlyFavorites || location.isFavorite);
  });

  const toggleFilter = () => {
    setShowOnlyFavorites(!showOnlyFavorites);
  };

  const renderItem = ({ item }: RenderItemProps) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => {
        Alert.alert(
          item.name,
          `Latitude: ${item.latitude}\nLongitude: ${item.longitude}\n${item.description || 'No description'}`
        );
      }}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description || 'No description'}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons 
            name={item.isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color="#FF4B55" 
          />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'No locations match your search'
          : 'No saved locations yet'}
      </Text>
    </View>
  );

  if (isLoading) {
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
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={16} color="#fff" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[
            styles.filterButton,
            showOnlyFavorites && { backgroundColor: '#FFE5E7' }
          ]}
          onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
        >
          <Ionicons
            name={showOnlyFavorites ? 'heart' : 'heart-outline'}
            size={24}
            color={showOnlyFavorites ? '#FF4B55' : '#666'}
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <TouchableOpacity 
          style={styles.errorContainer} 
          onPress={loadSavedLocations}
        >
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={async () => {
                if (isOnline) {
                  await startSync();
                  loadSavedLocations();
                }
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF4B55',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    color: '#666',
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});
