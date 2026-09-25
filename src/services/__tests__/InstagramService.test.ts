jest.mock('../../config/api', () => ({
  apiFetch: jest.fn(),
}));
jest.mock('../AuthService', () => ({
  authService: {
    withAuth: jest.fn((request: (token: string | null) => Promise<any>) => request('fake-token')),
  },
}));

import { apiFetch } from '../../config/api';
import { InstagramService } from '../InstagramService';

const mockedApiFetch = apiFetch as jest.Mock;

describe('InstagramService.analyzeReel', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('normalizes freshly-extracted Gemini locations (nested coordinates)', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      status: 'new',
      url: 'https://www.instagram.com/reel/abc123/',
      locations: [
        { name: 'Eiffel Tower', type: 'landmark', category: 'monument', coordinates: { latitude: 48.8584, longitude: 2.2945 } },
        { name: 'Somewhere unnamed', type: 'city', category: 'city', coordinates: null },
      ],
      metadata: { description: 'A trip to Paris' },
    });

    const result = await InstagramService.analyzeReel('https://www.instagram.com/reel/abc123/');

    expect(result.status).toBe('new');
    if (result.status !== 'new') throw new Error('expected new');
    expect(result.locations).toEqual([
      { name: 'Eiffel Tower', category: 'monument', coordinates: { latitude: 48.8584, longitude: 2.2945 } },
      { name: 'Somewhere unnamed', category: 'city', coordinates: null },
    ]);
    expect(result.description).toBe('A trip to Paris');
  });

  it('normalizes already-saved Location rows (flat latitude/longitude)', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      status: 'existing',
      locations: [
        { id: 'loc-1', name: 'Eiffel Tower', latitude: 48.8584, longitude: 2.2945, category: 'monument', address: 'Paris' },
      ],
    });

    const result = await InstagramService.analyzeReel('https://www.instagram.com/reel/abc123/');

    expect(result.status).toBe('new');
    if (result.status !== 'new') throw new Error('expected new');
    expect(result.locations).toEqual([
      { name: 'Eiffel Tower', category: 'monument', address: 'Paris', coordinates: { latitude: 48.8584, longitude: 2.2945 } },
    ]);
  });

  it('passes through manual_required responses as-is', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      status: 'manual_required',
      url: 'https://www.instagram.com/reel/abc123/',
      reason: "Couldn't read this reel's caption automatically.",
    });

    const result = await InstagramService.analyzeReel('https://www.instagram.com/reel/abc123/');

    expect(result).toEqual({
      status: 'manual_required',
      url: 'https://www.instagram.com/reel/abc123/',
      reason: "Couldn't read this reel's caption automatically.",
    });
  });
});
