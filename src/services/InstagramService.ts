//src/services/InstagramService.ts
import { apiFetch } from '../config/api';
import { authService } from './AuthService';

export interface ExtractedLocation {
  name: string;
  category?: string;
  address?: string;
  coordinates: { latitude: number; longitude: number } | null;
}

export type AnalyzeReelResult =
  | { status: 'new'; url: string; locations: ExtractedLocation[]; description?: string }
  | { status: 'manual_required'; url: string; reason: string };

function normalizeLocations(raw: any[]): ExtractedLocation[] {
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      // The backend returns two shapes depending on whether the reel was
      // freshly analyzed by Gemini ({name, type, category, coordinates})
      // or already existed as a saved Location ({name, latitude, longitude,
      // category, address, ...}) - normalize both to one shape here so the
      // UI doesn't need to know the difference.
      if (item.coordinates !== undefined) {
        return {
          name: item.name || 'Unnamed location',
          category: item.category,
          coordinates: item.coordinates
            ? { latitude: item.coordinates.latitude, longitude: item.coordinates.longitude }
            : null,
        };
      }
      return {
        name: item.name || 'Unnamed location',
        category: item.category,
        address: item.address,
        coordinates:
          item.latitude != null && item.longitude != null
            ? { latitude: item.latitude, longitude: item.longitude }
            : null,
      };
    });
}

class InstagramService {
  static async analyzeReel(url: string): Promise<AnalyzeReelResult> {
    const data = await authService.withAuth((token) =>
      apiFetch('/analyze-reel/', { method: 'POST', body: JSON.stringify({ url }) }, token)
    );

    if (data.status === 'manual_required') {
      return { status: 'manual_required', url: data.url, reason: data.reason };
    }

    return {
      status: 'new',
      url: data.url || url,
      locations: normalizeLocations(data.locations || []),
      description: data.metadata?.description,
    };
  }
}

export { InstagramService };
