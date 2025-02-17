import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationType, SearchResult } from '../types/location';

class LocationService {
  private static readonly STORAGE_KEY = 'saved_locations';
  private static readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

  static async getSavedLocations() {
    try {
      const savedLocations = await AsyncStorage.getItem(this.STORAGE_KEY);
      return savedLocations ? JSON.parse(savedLocations) : [];
    } catch (error) {
      console.error('Error getting saved locations:', error);
      return [];
    }
  }

  static async searchLocations(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_API}?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        }
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  static async saveLocation(location: LocationType) {
    try {
      const savedLocations = await this.getSavedLocations();
      const newLocation = {
        ...location,
        id: location.id || Date.now().toString(),
        savedAt: location.savedAt || new Date().toISOString()
      };
      
      const updatedLocations = [...savedLocations, newLocation];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLocations));
      
      return newLocation;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  static async deleteLocation(locationId: string) {
    try {
      const savedLocations = await this.getSavedLocations();
      const updatedLocations = savedLocations.filter((loc: LocationType) => loc.id !== locationId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLocations));
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  static async updateLocation(location: LocationType) {
    try {
      const savedLocations = await this.getSavedLocations();
      const locationIndex = savedLocations.findIndex((loc: LocationType) => loc.id === location.id);
      
      if (locationIndex === -1) {
        throw new Error('Location not found');
      }

      // Update the location while preserving the original savedAt date
      const updatedLocation = {
        ...location,
        updatedAt: new Date().toISOString(),
        savedAt: savedLocations[locationIndex].savedAt
      };
      
      savedLocations[locationIndex] = updatedLocation;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedLocations));
      
      return updatedLocation;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  static async getLocations(): Promise<LocationType[]> {
    const jsonValue = await AsyncStorage.getItem('@locations');
    return jsonValue ? JSON.parse(jsonValue) : [];
  }
}

export { LocationService };