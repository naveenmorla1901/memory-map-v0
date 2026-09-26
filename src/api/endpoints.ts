import { request } from './client';
import { sessionStore } from './session';
import type {
  GeocodeResult,
  Place,
  PlaceInput,
  PlacePatch,
  PlaceStats,
  ReelAnalysis,
  TokenPair,
  User,
} from './types';

export const authApi = {
  async signIn(email: string, password: string): Promise<User> {
    const data = await request<TokenPair & { user: User }>('/auth/token/', {
      method: 'POST',
      body: { email: email.trim(), password },
      auth: false,
    });
    await sessionStore.set({ access: data.access, refresh: data.refresh, user: data.user });
    return data.user;
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const data = await request<{ user: User; tokens: TokenPair }>('/auth/register/', {
      method: 'POST',
      body: { name: name.trim(), email: email.trim(), password },
      auth: false,
    });
    await sessionStore.set({ ...data.tokens, user: data.user });
    return data.user;
  },

  async signOut(): Promise<void> {
    const refresh = sessionStore.get()?.refresh;
    await sessionStore.clear();
    if (refresh) {
      // Best effort: the local session is already gone either way.
      request('/auth/logout/', { method: 'POST', body: { refresh }, auth: false, timeoutMs: 5000 }).catch(() => {});
    }
  },

  async me(): Promise<User> {
    const user = await request<User>('/auth/me/');
    await sessionStore.update({ user });
    return user;
  },

  async updateProfile(changes: { name?: string; email?: string }): Promise<User> {
    const user = await request<User>('/auth/me/', { method: 'PATCH', body: changes });
    await sessionStore.update({ user });
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const data = await request<{ tokens: TokenPair }>('/auth/change-password/', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
    await sessionStore.update(data.tokens);
  },

  requestPasswordReset(email: string): Promise<{ detail: string }> {
    return request('/auth/password-reset/', { method: 'POST', body: { email: email.trim() }, auth: false });
  },

  async deleteAccount(password: string): Promise<void> {
    await request('/auth/me/', { method: 'DELETE', body: { password } });
    await sessionStore.clear();
  },
};

export const placesApi = {
  list: () => request<Place[]>('/locations/'),
  create: (input: PlaceInput) => request<Place>('/locations/', { method: 'POST', body: input }),
  createMany: (places: PlaceInput[]) => request<Place[]>('/locations/bulk/', { method: 'POST', body: { locations: places } }),
  update: (id: string, patch: PlacePatch) => request<Place>(`/locations/${id}/`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<void>(`/locations/${id}/`, { method: 'DELETE' }),
  stats: () => request<PlaceStats>('/locations/stats/'),
};

export const reelsApi = {
  // A cold (uncached) reel waits on Instagram + Gemini + geocoding.
  analyze: (url: string) => request<ReelAnalysis>('/reels/analyze/', { method: 'POST', body: { url }, timeoutMs: 60_000 }),
};

export const geocodeApi = {
  search: (q: string, near?: { latitude: number; longitude: number } | null) =>
    request<GeocodeResult[]>('/geocode/search/', {
      query: { q, lat: near?.latitude, lon: near?.longitude },
      timeoutMs: 10_000,
    }),
  reverse: (latitude: number, longitude: number) =>
    request<GeocodeResult>('/geocode/reverse/', { query: { lat: latitude, lon: longitude }, timeoutMs: 10_000 }),
};
