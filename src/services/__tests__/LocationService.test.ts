jest.mock('../../config/api', () => ({
  apiFetch: jest.fn(),
}));
jest.mock('../AuthService', () => ({
  authService: {
    withAuth: jest.fn((request: (token: string | null) => Promise<any>) => request('fake-token')),
  },
}));

import { apiFetch } from '../../config/api';
import { LocationService } from '../LocationService';
import { LocationType } from '../../types/location';

const mockedApiFetch = apiFetch as jest.Mock;

const backendUserLocation = {
  id: 'ul-1',
  location: {
    id: 'loc-1',
    name: 'Golden Gate Bridge',
    latitude: 37.8199,
    longitude: -122.4783,
    description: 'Iconic bridge',
    category: 'Landmark',
    address: 'San Francisco, CA',
    is_instagram_source: true,
    instagram_url: 'https://www.instagram.com/reel/abc123/',
  },
  custom_name: '',
  custom_description: '',
  custom_category: '',
  notes: 'so pretty',
  is_favorite: true,
  notify_enabled: false,
  notify_radius: 2.0,
  saved_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

describe('LocationService', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('getSavedLocations flattens the nested backend shape into LocationType', async () => {
    mockedApiFetch.mockResolvedValueOnce([backendUserLocation]);

    const locations = await LocationService.getSavedLocations();

    expect(mockedApiFetch).toHaveBeenCalledWith('/user-locations/', { method: 'GET' }, 'fake-token');
    expect(locations).toEqual([
      {
        id: 'ul-1',
        name: 'Golden Gate Bridge',
        address: 'San Francisco, CA',
        coordinates: { latitude: 37.8199, longitude: -122.4783 },
        category: 'Landmark',
        description: 'Iconic bridge',
        isInstagramSource: true,
        instagramUrl: 'https://www.instagram.com/reel/abc123/',
        savedAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        isFavorite: true,
        notifyEnabled: false,
        notifyRadius: 2.0,
        notes: 'so pretty',
      },
    ]);
  });

  it('getSavedLocations returns an empty array (not a throw) if the request fails', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('network error'));
    await expect(LocationService.getSavedLocations()).resolves.toEqual([]);
  });

  it('prefers custom_name/custom_category over the shared location defaults', async () => {
    mockedApiFetch.mockResolvedValueOnce([
      { ...backendUserLocation, custom_name: 'My spot', custom_category: 'Favorites' },
    ]);
    const [location] = await LocationService.getSavedLocations();
    expect(location.name).toBe('My spot');
    expect(location.category).toBe('Favorites');
  });

  it('saveLocation posts a flat payload and returns the mapped result', async () => {
    mockedApiFetch.mockResolvedValueOnce(backendUserLocation);

    const input: LocationType = {
      id: 'temp-123',
      name: 'Golden Gate Bridge',
      address: 'San Francisco, CA',
      coordinates: { latitude: 37.8199, longitude: -122.4783 },
      category: 'Landmark',
      description: 'Iconic bridge',
      isInstagramSource: true,
      instagramUrl: 'https://www.instagram.com/reel/abc123/',
      isFavorite: true,
      notifyRadius: 2.0,
      notes: 'so pretty',
    };

    const result = await LocationService.saveLocation(input);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/user-locations/',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Golden Gate Bridge',
          latitude: 37.8199,
          longitude: -122.4783,
          description: 'Iconic bridge',
          category: 'Landmark',
          address: 'San Francisco, CA',
          is_instagram_source: true,
          instagram_url: 'https://www.instagram.com/reel/abc123/',
          notes: 'so pretty',
          is_favorite: true,
          notify_enabled: false,
          notify_radius: 2.0,
        }),
      },
      'fake-token'
    );
    expect(result.id).toBe('ul-1');
  });

  it('updateLocation PATCHes /user-locations/{id}/', async () => {
    mockedApiFetch.mockResolvedValueOnce(backendUserLocation);

    await LocationService.updateLocation({
      id: 'ul-1',
      name: 'Golden Gate Bridge',
      address: '',
      coordinates: { latitude: 37.8199, longitude: -122.4783 },
      notes: '',
    });

    const [path, options] = mockedApiFetch.mock.calls[0];
    expect(path).toBe('/user-locations/ul-1/');
    expect(options.method).toBe('PATCH');
  });

  it('deleteLocation DELETEs /user-locations/{id}/', async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);
    await LocationService.deleteLocation('ul-1');
    expect(mockedApiFetch).toHaveBeenCalledWith('/user-locations/ul-1/', { method: 'DELETE' }, 'fake-token');
  });
});
