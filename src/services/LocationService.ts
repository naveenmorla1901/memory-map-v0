//src/services/LocationService.ts
import { apiFetch } from '../config/api';
import { authService } from './AuthService';
import { LocationType, SearchResult } from '../types/location';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

interface BackendLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  category: string;
  address: string;
  is_instagram_source: boolean;
  instagram_url: string;
}

interface BackendUserLocation {
  id: string;
  location: BackendLocation;
  custom_name: string;
  custom_description: string;
  custom_category: string;
  notes: string;
  is_favorite: boolean;
  notify_enabled: boolean;
  notify_radius: number;
  saved_at: string;
  updated_at: string;
}

function toLocationType(userLocation: BackendUserLocation): LocationType {
  const { location } = userLocation;
  return {
    id: userLocation.id,
    name: userLocation.custom_name || location.name,
    address: location.address,
    coordinates: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    category: userLocation.custom_category || location.category,
    description: userLocation.custom_description || location.description,
    isInstagramSource: location.is_instagram_source,
    instagramUrl: location.instagram_url,
    savedAt: userLocation.saved_at,
    updatedAt: userLocation.updated_at,
    isFavorite: userLocation.is_favorite,
    notifyEnabled: userLocation.notify_enabled,
    notifyRadius: userLocation.notify_radius,
    notes: userLocation.notes || '',
  };
}

function toSavedLocationPayload(location: LocationType) {
  return {
    name: location.name,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude,
    description: location.description || '',
    category: location.category || '',
    address: location.address || '',
    is_instagram_source: location.isInstagramSource || false,
    instagram_url: location.instagramUrl || '',
    notes: location.notes || '',
    is_favorite: location.isFavorite || false,
    notify_enabled: location.notifyEnabled || false,
    notify_radius: location.notifyRadius || 1.0,
  };
}

class LocationService {
  static async getSavedLocations(): Promise<LocationType[]> {
    try {
      const data: BackendUserLocation[] = await authService.withAuth((token) =>
        apiFetch('/user-locations/', { method: 'GET' }, token)
      );
      return data.map(toLocationType);
    } catch (error) {
      console.error('Error getting saved locations:', error);
      return [];
    }
  }

  static async searchLocations(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${NOMINATIM_API}?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'User-Agent': 'MemoryMap/1.0' } }
      );
      const data = await response.json();

      return data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  static async saveLocation(location: LocationType): Promise<LocationType> {
    try {
      const saved: BackendUserLocation = await authService.withAuth((token) =>
        apiFetch(
          '/user-locations/',
          { method: 'POST', body: JSON.stringify(toSavedLocationPayload(location)) },
          token
        )
      );
      return toLocationType(saved);
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  static async deleteLocation(locationId: string): Promise<void> {
    try {
      await authService.withAuth((token) =>
        apiFetch(`/user-locations/${locationId}/`, { method: 'DELETE' }, token)
      );
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  static async updateLocation(location: LocationType): Promise<LocationType> {
    try {
      const updated: BackendUserLocation = await authService.withAuth((token) =>
        apiFetch(
          `/user-locations/${location.id}/`,
          { method: 'PATCH', body: JSON.stringify(toSavedLocationPayload(location)) },
          token
        )
      );
      return toLocationType(updated);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }
}

export { LocationService };
