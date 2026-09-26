import type { CategoryKey } from '../theme/categories';

export interface User {
  id: number;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  notes: string;
  category: CategoryKey;
  latitude: number;
  longitude: number;
  address: string;
  source: 'manual' | 'instagram';
  instagram_url: string;
  is_favorite: boolean;
  visited: boolean;
  notify_enabled: boolean;
  notify_radius_km: number;
  created_at: string;
  updated_at: string;
}

/** What the app sends to create a place. */
export type PlaceInput = Pick<Place, 'name' | 'latitude' | 'longitude'> &
  Partial<Pick<Place, 'category' | 'address' | 'description' | 'notes' | 'instagram_url' | 'is_favorite' | 'visited' | 'notify_enabled' | 'notify_radius_km'>>;

export type PlacePatch = Partial<Omit<Place, 'id' | 'created_at' | 'updated_at' | 'source'>>;

export interface PlaceStats {
  total: number;
  favorites: number;
  visited: number;
  from_instagram: number;
  by_category: Partial<Record<CategoryKey, number>>;
}

export interface GeocodeResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: CategoryKey;
}

export interface ExtractedPlace {
  name: string;
  category: CategoryKey;
  address: string;
  latitude: number | null;
  longitude: number | null;
  confidence: number;
  already_saved: boolean;
}

export type ReelAnalysis =
  | { status: 'found'; url: string; caption: string; places: ExtractedPlace[] }
  | { status: 'manual_required'; url: string; reason: string; caption?: string };
