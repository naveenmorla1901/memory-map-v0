import type { ReelAnalysis } from '../../api/types';
import { shareReducer, ShareState, toPlaceInputs } from '../shareFlowState';

const URL = 'https://www.instagram.com/reel/ABC/';

const found: ReelAnalysis = {
  status: 'found',
  url: URL,
  caption: 'Tacos and a sunset',
  places: [
    { name: 'El Huequito', category: 'food', address: 'Mexico City', latitude: 19.4, longitude: -99.1, confidence: 0.95, already_saved: false },
    { name: 'Mirador', category: 'viewpoint', address: '', latitude: null, longitude: null, confidence: 0.7, already_saved: false },
    { name: 'Cafe Old', category: 'cafe', address: 'CDMX', latitude: 19.3, longitude: -99.2, confidence: 0.9, already_saved: true },
  ],
};

const review = (): ShareState & { kind: 'review' } => {
  const state = shareReducer({ kind: 'analyzing' }, { type: 'analyzed', result: found });
  if (state.kind !== 'review') throw new Error('expected review');
  return state;
};

describe('shareReducer', () => {
  it('pre-selects only findable, not-yet-saved places', () => {
    const state = review();
    expect(state.candidates).toHaveLength(3);
    expect(state.selected).toEqual(['reel-0']);
  });

  it('manual_required goes straight to an empty review with the reason', () => {
    const state = shareReducer({ kind: 'analyzing' }, { type: 'analyzed', result: { status: 'manual_required', url: URL, reason: 'Private reel.' } });
    expect(state).toMatchObject({ kind: 'review', candidates: [], selected: [], manualReason: 'Private reel.' });
  });

  it('toggles selectable places and ignores the rest', () => {
    let state: ShareState = review();
    state = shareReducer(state, { type: 'toggle', key: 'reel-0' });
    expect(state.kind === 'review' && state.selected).toEqual([]);
    state = shareReducer(state, { type: 'toggle', key: 'reel-1' }); // no coordinates
    state = shareReducer(state, { type: 'toggle', key: 'reel-2' }); // already saved
    expect(state.kind === 'review' && state.selected).toEqual([]);
  });

  it('fixes an unfound place from search, keeping its name and category', () => {
    let state: ShareState = shareReducer(review(), { type: 'openSearch', replacingKey: 'reel-1' });
    expect(state).toMatchObject({ kind: 'search', initialQuery: 'Mirador', replacingKey: 'reel-1' });
    state = shareReducer(state, {
      type: 'picked',
      result: { id: 'N1', name: 'Mirador del Sol', address: 'Somewhere, Mexico', latitude: 19.5, longitude: -99.0, category: 'other' },
    });
    if (state.kind !== 'review') throw new Error('expected review');
    const fixed = state.candidates.find((candidate) => candidate.key === 'reel-1')!;
    expect(fixed).toMatchObject({ name: 'Mirador', category: 'viewpoint', latitude: 19.5, address: 'Somewhere, Mexico' });
    expect(state.selected).toEqual(['reel-0', 'reel-1']);
  });

  it('adds a searched place as a new candidate', () => {
    let state: ShareState = shareReducer(review(), { type: 'openSearch' });
    state = shareReducer(state, {
      type: 'picked',
      result: { id: 'W9', name: 'Museo Frida Kahlo', address: 'Coyoacán', latitude: 19.35, longitude: -99.16, category: 'culture' },
    });
    if (state.kind !== 'review') throw new Error('expected review');
    expect(state.candidates.map((candidate) => candidate.name)).toContain('Museo Frida Kahlo');
    expect(state.selected).toContain('search-W9');
  });

  it('closing search returns to the same review', () => {
    const before = review();
    const state = shareReducer(shareReducer(before, { type: 'openSearch' }), { type: 'closeSearch' });
    expect(state).toBe(before);
  });

  it('only saves when something is selected, and recovers from a failed save', () => {
    const none = shareReducer(review(), { type: 'toggle', key: 'reel-0' });
    expect(shareReducer(none, { type: 'save' })).toBe(none);

    const before = review();
    const saving = shareReducer(before, { type: 'save' });
    expect(saving.kind).toBe('saving');
    expect(shareReducer(saving, { type: 'saveFailed' })).toBe(before);
  });

  it('builds the bulk-save request from the selection', () => {
    expect(toPlaceInputs(review(), URL)).toEqual([
      { name: 'El Huequito', category: 'food', address: 'Mexico City', latitude: 19.4, longitude: -99.1, instagram_url: URL },
    ]);
  });
});
