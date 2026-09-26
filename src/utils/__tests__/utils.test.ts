import { extractInstagramUrl } from '../instagram';
import { boundsOf, distanceKm, formatDistance, shortAddress } from '../geo';
import { initials, pluralize, relativeDate } from '../format';
import { passwordStrength, validateEmail, validateNewPassword } from '../validation';

describe('extractInstagramUrl', () => {
  it.each([
    ['https://www.instagram.com/reel/ABC123/', 'https://www.instagram.com/reel/ABC123/'],
    ['Check this out! https://www.instagram.com/reel/ABC123/?igsh=xyz.', 'https://www.instagram.com/reel/ABC123/?igsh=xyz'],
    ['https://instagram.com/p/XyZ_-9/', 'https://instagram.com/p/XyZ_-9/'],
    ['(https://m.instagram.com/reels/Q1w2/)', 'https://m.instagram.com/reels/Q1w2/'],
  ])('finds the link in %p', (text, expected) => {
    expect(extractInstagramUrl(text)).toBe(expected);
  });

  it.each([null, '', 'no link here', 'https://www.instagram.com/someone/', 'https://example.com/reel/ABC/'])(
    'ignores %p',
    (text) => {
      expect(extractInstagramUrl(text)).toBeNull();
    },
  );
});

describe('geo', () => {
  it('measures distances', () => {
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const london = { latitude: 51.5074, longitude: -0.1278 };
    expect(distanceKm(paris, london)).toBeCloseTo(343.5, 0);
    expect(distanceKm(paris, paris)).toBe(0);
  });

  it('formats distances for people', () => {
    expect(formatDistance(0.004)).toBe('10 m');
    expect(formatDistance(0.347)).toBe('350 m');
    expect(formatDistance(1.234)).toBe('1.2 km');
    expect(formatDistance(48.4)).toBe('48 km');
    expect(formatDistance(1, 'mi')).toBe('0.6 mi');
    expect(formatDistance(0.05, 'mi')).toBe('160 ft');
  });

  it('pads bounds and handles empty input', () => {
    expect(boundsOf([])).toBeNull();
    const [west, south, east, north] = boundsOf([
      { latitude: 10, longitude: 20 },
      { latitude: 12, longitude: 24 },
    ])!;
    expect(west).toBeLessThan(20);
    expect(east).toBeGreaterThan(24);
    expect(south).toBeLessThan(10);
    expect(north).toBeGreaterThan(12);
  });

  it('shortens addresses to street/neighborhood and city', () => {
    expect(shortAddress('600 Guerrero St, Mission District, San Francisco, California, United States')).toBe('Mission District, San Francisco');
    expect(shortAddress('5 Avenue Anatole France, Paris, Île-de-France, France')).toBe('5 Avenue Anatole France, Paris');
    expect(shortAddress('San Francisco, California, United States')).toBe('San Francisco, California');
    expect(shortAddress('Paris, France')).toBe('Paris, France');
  });
});

describe('format', () => {
  it('builds initials', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Grace Brewster Hopper')).toBe('GH');
    expect(initials('cher')).toBe('CH');
    expect(initials('', 'zed@example.com')).toBe('Z');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'place')).toBe('1 place');
    expect(pluralize(3, 'place')).toBe('3 places');
  });

  it('describes dates relative to now', () => {
    const now = new Date(2026, 8, 26, 12);
    expect(relativeDate(new Date(2026, 8, 26, 8).toISOString(), now)).toBe('Today');
    expect(relativeDate(new Date(2026, 8, 25, 23).toISOString(), now)).toBe('Yesterday');
    expect(relativeDate(new Date(2026, 8, 22).toISOString(), now)).toBe('4 days ago');
    expect(relativeDate('not a date', now)).toBe('');
  });
});

describe('validation', () => {
  it('checks emails', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('nope')).toBeTruthy();
    expect(validateEmail(' ada@example.com ')).toBeUndefined();
  });

  it('mirrors the server password rules', () => {
    expect(validateNewPassword('short')).toMatch(/8 characters/);
    expect(validateNewPassword('1234567890')).toMatch(/only numbers/);
    expect(validateNewPassword('password123')).toMatch(/common/);
    expect(validateNewPassword('lovelace-rocks-99', { name: 'Ada Lovelace' })).toMatch(/similar/);
    expect(validateNewPassword('Correct-Horse-9')).toBeUndefined();
  });

  it('rates strength', () => {
    expect(passwordStrength('short')).toBe(0);
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('Correct-Horse-Battery-9')).toBe(3);
  });
});

describe('searchBias', () => {
  const { searchBias } = require('../geo');
  it('prefers the phone location, then the middle of saved places', () => {
    const here = { latitude: 1, longitude: 1 };
    expect(searchBias(here, [])).toBe(here);
    expect(searchBias(null, [])).toBeNull();
    const sf = [
      { latitude: 37.76, longitude: -122.42 },
      { latitude: 37.78, longitude: -122.41 },
      { latitude: 48.85, longitude: 2.35 }, // One trip to Paris.
    ];
    expect(searchBias(null, sf)).toEqual({ latitude: 37.78, longitude: -122.41 });
  });
});
