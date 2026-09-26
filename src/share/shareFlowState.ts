import type { ExtractedPlace, GeocodeResult, Place, PlaceInput, ReelAnalysis } from '../api/types';

/** A place the user can choose to save from a reel. */
export interface Candidate {
  key: string;
  name: string;
  category: ExtractedPlace['category'];
  address: string;
  latitude: number | null;
  longitude: number | null;
  alreadySaved: boolean;
}

export type ShareState =
  | { kind: 'analyzing' }
  | { kind: 'review'; candidates: Candidate[]; selected: string[]; caption: string; manualReason: string | null }
  | { kind: 'search'; previous: ShareState & { kind: 'review' }; replacingKey: string | null; initialQuery: string }
  | { kind: 'saving'; previous: ShareState & { kind: 'review' } }
  | { kind: 'saved'; places: Place[] }
  | { kind: 'error'; message: string };

export type ShareAction =
  | { type: 'analyzed'; result: ReelAnalysis }
  | { type: 'failed'; message: string }
  | { type: 'retry' }
  | { type: 'toggle'; key: string }
  | { type: 'openSearch'; replacingKey?: string }
  | { type: 'closeSearch' }
  | { type: 'picked'; result: GeocodeResult }
  | { type: 'save' }
  | { type: 'saveFailed' }
  | { type: 'saved'; places: Place[] };

const hasLocation = (candidate: Candidate) => candidate.latitude !== null && candidate.longitude !== null;

const selectable = (candidate: Candidate) => hasLocation(candidate) && !candidate.alreadySaved;

export function fromExtracted(place: ExtractedPlace, index: number): Candidate {
  return {
    key: `reel-${index}`,
    name: place.name,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    alreadySaved: place.already_saved,
  };
}

function emptyReview(caption: string, manualReason: string | null): ShareState & { kind: 'review' } {
  return { kind: 'review', candidates: [], selected: [], caption, manualReason };
}

export function shareReducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'analyzed': {
      const { result } = action;
      if (result.status === 'manual_required') {
        return emptyReview(result.caption ?? '', result.reason);
      }
      const candidates = result.places.map(fromExtracted);
      return {
        kind: 'review',
        candidates,
        // Everything findable and new starts ticked - the common case is "save them all".
        selected: candidates.filter(selectable).map((candidate) => candidate.key),
        caption: result.caption,
        manualReason: null,
      };
    }
    case 'failed':
      return { kind: 'error', message: action.message };
    case 'retry':
      return { kind: 'analyzing' };
    case 'toggle': {
      if (state.kind !== 'review') return state;
      const candidate = state.candidates.find((item) => item.key === action.key);
      if (!candidate || !selectable(candidate)) return state;
      const selected = state.selected.includes(action.key)
        ? state.selected.filter((key) => key !== action.key)
        : [...state.selected, action.key];
      return { ...state, selected };
    }
    case 'openSearch': {
      if (state.kind !== 'review') return state;
      const replacing = state.candidates.find((item) => item.key === action.replacingKey);
      return { kind: 'search', previous: state, replacingKey: replacing?.key ?? null, initialQuery: replacing?.name ?? '' };
    }
    case 'closeSearch':
      return state.kind === 'search' ? state.previous : state;
    case 'picked': {
      if (state.kind !== 'search') return state;
      const { previous, replacingKey } = state;
      const picked: Candidate = {
        key: replacingKey ?? `search-${action.result.id}`,
        name: replacingKey ? previous.candidates.find((item) => item.key === replacingKey)!.name : action.result.name,
        category: replacingKey
          ? previous.candidates.find((item) => item.key === replacingKey)!.category
          : action.result.category,
        address: action.result.address,
        latitude: action.result.latitude,
        longitude: action.result.longitude,
        alreadySaved: false,
      };
      const exists = previous.candidates.some((item) => item.key === picked.key);
      const candidates = exists
        ? previous.candidates.map((item) => (item.key === picked.key ? picked : item))
        : [...previous.candidates, picked];
      const selected = previous.selected.includes(picked.key) ? previous.selected : [...previous.selected, picked.key];
      return { ...previous, candidates, selected };
    }
    case 'save':
      return state.kind === 'review' && state.selected.length > 0 ? { kind: 'saving', previous: state } : state;
    case 'saveFailed':
      return state.kind === 'saving' ? state.previous : state;
    case 'saved':
      return { kind: 'saved', places: action.places };
  }
}

/** The request body for saving the ticked candidates. */
export function toPlaceInputs(state: ShareState & { kind: 'review' }, reelUrl: string): PlaceInput[] {
  return state.candidates
    .filter((candidate) => state.selected.includes(candidate.key) && hasLocation(candidate))
    .map((candidate) => ({
      name: candidate.name,
      category: candidate.category,
      address: candidate.address,
      latitude: candidate.latitude as number,
      longitude: candidate.longitude as number,
      instagram_url: reelUrl,
    }));
}
