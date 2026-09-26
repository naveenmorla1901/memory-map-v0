import type { Place } from '../api/types';

type Status = 'loading' | 'ready' | 'error';

export interface PlacesState {
  places: Place[];
  status: Status;
  /** Loaded from the device cache, not yet confirmed with the server. */
  stale: boolean;
  error: string | null;
}

export type PlacesAction =
  | { type: 'reset' }
  | { type: 'cached'; places: Place[] }
  | { type: 'loaded'; places: Place[] }
  | { type: 'failed'; error: string }
  | { type: 'upsert'; places: Place[] }
  | { type: 'remove'; id: string };

export const initialPlacesState: PlacesState = { places: [], status: 'loading', stale: false, error: null };

const byNewest = (a: Place, b: Place) => b.created_at.localeCompare(a.created_at);

export function placesReducer(state: PlacesState, action: PlacesAction): PlacesState {
  switch (action.type) {
    case 'reset':
      return initialPlacesState;
    case 'cached':
      return state.status === 'ready' ? state : { ...state, places: action.places, status: 'ready', stale: true };
    case 'loaded':
      return { places: [...action.places].sort(byNewest), status: 'ready', stale: false, error: null };
    case 'failed':
      // Keep showing whatever we have (cached copy) - just note the error.
      return { ...state, status: state.places.length || state.stale ? 'ready' : 'error', error: action.error };
    case 'upsert': {
      const incoming = new Map(action.places.map((place) => [place.id, place]));
      const kept = state.places.filter((place) => !incoming.has(place.id));
      return { ...state, places: [...kept, ...incoming.values()].sort(byNewest) };
    }
    case 'remove':
      return { ...state, places: state.places.filter((place) => place.id !== action.id) };
  }
}
