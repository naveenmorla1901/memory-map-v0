import type { Place } from '../../api/types';
import { pickRegions } from '../nearby';

const place = (id: string, latitude: number, notify = true): Place =>
  ({ id, name: id, latitude, longitude: 0, notify_enabled: notify, notify_radius_km: 1 }) as Place;

describe('pickRegions', () => {
  it('watches only alert-enabled places, nearest first, within the limit', () => {
    const places = [place('far', 10), place('off', 0.01, false), place('near', 0.1), place('mid', 1)];
    expect(pickRegions(places, { latitude: 0, longitude: 0 }, 2).map((p) => p.id)).toEqual(['near', 'mid']);
  });

  it('keeps list order without a location', () => {
    const places = [place('a', 5), place('b', 1)];
    expect(pickRegions(places, null).map((p) => p.id)).toEqual(['a', 'b']);
  });
});
