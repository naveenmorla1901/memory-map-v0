import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Mirrors the backend's apps/core/categories.py. Keys must match; labels,
 * icons and colors are app-side.
 */
export const CATEGORIES = [
  { key: 'food', label: 'Food', icon: 'restaurant', color: '#F2842F' },
  { key: 'cafe', label: 'Cafe', icon: 'cafe', color: '#A66A3F' },
  { key: 'bar', label: 'Bars & nightlife', icon: 'wine', color: '#9B51E0' },
  { key: 'nature', label: 'Nature', icon: 'leaf', color: '#27A35A' },
  { key: 'beach', label: 'Beach', icon: 'umbrella', color: '#1E9BD7' },
  { key: 'viewpoint', label: 'Viewpoint', icon: 'telescope', color: '#3F7FD9' },
  { key: 'landmark', label: 'Landmark', icon: 'flag', color: '#E0457B' },
  { key: 'culture', label: 'Culture', icon: 'color-palette', color: '#C04BC6' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle', color: '#D9A21E' },
  { key: 'stay', label: 'Stay', icon: 'bed', color: '#5B6BD6' },
  { key: 'activity', label: 'Activity', icon: 'ticket', color: '#13A89E' },
  { key: 'other', label: 'Other', icon: 'location', color: '#7A7A88' },
] as const satisfies ReadonlyArray<{ key: string; label: string; icon: IconName; color: string }>;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];
export type Category = (typeof CATEGORIES)[number];

const BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<CategoryKey, Category>;

export function getCategory(key: string | null | undefined): Category {
  return BY_KEY[(key || 'other') as CategoryKey] ?? BY_KEY.other;
}

/** MapLibre `match` expression: category key -> color. */
export const CATEGORY_COLOR_EXPRESSION = [
  'match',
  ['get', 'category'],
  ...CATEGORIES.flatMap((c) => [c.key, c.color]),
  BY_KEY.other.color,
] as unknown as string;
