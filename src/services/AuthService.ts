//src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, ApiError } from '../config/api';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface RegisterFields {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

const STORAGE_KEYS = {
  access: 'auth_access_token',
  refresh: 'auth_refresh_token',
  user: 'auth_user',
};

type AuthListener = (user: CurrentUser | null) => void;

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: CurrentUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private refreshPromise: Promise<string | null> | null = null;

  /** Load any persisted session and confirm it's still valid. Call once on app start. */
  async bootstrap(): Promise<CurrentUser | null> {
    const [access, refresh, userJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.access),
      AsyncStorage.getItem(STORAGE_KEYS.refresh),
      AsyncStorage.getItem(STORAGE_KEYS.user),
    ]);

    this.accessToken = access;
    this.refreshToken = refresh;
    this.currentUser = userJson ? JSON.parse(userJson) : null;

    if (!this.accessToken) {
      return null;
    }

    try {
      const data = await apiFetch('/auth/me/', { method: 'GET' }, await this.getValidAccessToken());
      this.currentUser = data.user;
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
      this.notify();
      return this.currentUser;
    } catch (error) {
      // Session is no longer valid (token expired/revoked with no usable refresh token).
      await this.clearSession();
      return null;
    }
  }

  async login(identifier: string, password: string): Promise<CurrentUser> {
    const data = await apiFetch('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username: identifier, password }),
    });

    await this.persistSession(data.access, data.refresh, data.user);
    return data.user;
  }

  async register(fields: RegisterFields): Promise<CurrentUser> {
    const data = await apiFetch('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(fields),
    });

    await this.persistSession(data.tokens.access, data.tokens.refresh, data.user);
    return data.user;
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await apiFetch(
          '/auth/logout/',
          { method: 'POST', body: JSON.stringify({ refresh_token: this.refreshToken }) },
          this.accessToken
        );
      }
    } catch (error) {
      // Even if the server call fails (expired token, offline), still clear the local session.
      console.warn('Logout request failed, clearing local session anyway:', error);
    } finally {
      await this.clearSession();
    }
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /** Returns a valid access token, transparently refreshing it if it's expired/missing. */
  async getValidAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  /** Runs `request` and retries it once after a token refresh if the server says the token expired. */
  async withAuth<T>(request: (accessToken: string | null) => Promise<T>): Promise<T> {
    try {
      return await request(this.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return await request(refreshed);
        }
      }
      throw error;
    }
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  private async persistSession(access: string, refresh: string, user: CurrentUser) {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.currentUser = user;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.access, access],
      [STORAGE_KEYS.refresh, refresh],
      [STORAGE_KEYS.user, JSON.stringify(user)],
    ]);
    this.notify();
  }

  private async clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    await AsyncStorage.multiRemove([STORAGE_KEYS.access, STORAGE_KEYS.refresh, STORAGE_KEYS.user]);
    this.notify();
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    // Coalesce concurrent refresh attempts into a single request.
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const data = await apiFetch('/auth/token/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh: this.refreshToken }),
          });
          this.accessToken = data.access;
          if (data.refresh) {
            this.refreshToken = data.refresh;
          }
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.access, this.accessToken as string],
            ...(data.refresh ? [[STORAGE_KEYS.refresh, this.refreshToken as string]] as [string, string][] : []),
          ]);
          return this.accessToken;
        } catch (error) {
          await this.clearSession();
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    return this.refreshPromise;
  }
}

export const authService = new AuthService();
