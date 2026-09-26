import type { Place } from '../../api/types';
import { placesReducer } from '../placesReducer';

const place = (id: string, created_at: string, extra: Partial<Place> = {}): Place => ({
  id,
  name: id,
  description: '',
  notes: '',
  category: 'other',
  latitude: 0,
  longitude: 0,
  address: '',
  source: 'manual',
  instagram_url: '',
  is_favorite: false,
  visited: false,
  notify_enabled: false,
  notify_radius_km: 1,
  created_at,
  updated_at: created_at,
  ...extra,
});

const initial = { places: [], status: 'loading' as const, stale: false, error: null };

describe('placesReducer', () => {
  it('shows the cached copy until the server answers, then replaces it', () => {
    let state = placesReducer(initial, { type: 'cached', places: [place('a', '2026-01-01')] });
    expect(state).toMatchObject({ status: 'ready', stale: true });
    state = placesReducer(state, { type: 'loaded', places: [place('b', '2026-01-02'), place('c', '2026-03-01')] });
    expect(state.stale).toBe(false);
    expect(state.places.map((p) => p.id)).toEqual(['c', 'b']);
  });

  it('ignores a late cache read after fresh data arrived', () => {
    const fresh = placesReducer(initial, { type: 'loaded', places: [place('fresh', '2026-01-01')] });
    expect(placesReducer(fresh, { type: 'cached', places: [place('old', '2020-01-01')] })).toBe(fresh);
  });

  it('keeps the cached list when a refresh fails', () => {
    const cached = placesReducer(initial, { type: 'cached', places: [place('a', '2026-01-01')] });
    const failed = placesReducer(cached, { type: 'failed', error: 'offline' });
    expect(failed).toMatchObject({ status: 'ready', error: 'offline' });
    expect(failed.places).toHaveLength(1);
    expect(placesReducer(initial, { type: 'failed', error: 'offline' }).status).toBe('error');
  });

  it('upserts and removes', () => {
    let state = placesReducer(initial, { type: 'loaded', places: [place('a', '2026-01-01')] });
    state = placesReducer(state, { type: 'upsert', places: [place('a', '2026-01-01', { is_favorite: true }), place('b', '2026-02-01')] });
    expect(state.places.map((p) => [p.id, p.is_favorite])).toEqual([
      ['b', false],
      ['a', true],
    ]);
    state = placesReducer(state, { type: 'remove', id: 'a' });
    expect(state.places.map((p) => p.id)).toEqual(['b']);
  });
});
