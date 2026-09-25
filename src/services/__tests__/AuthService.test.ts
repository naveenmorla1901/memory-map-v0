jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../AuthService';
import { ApiError } from '../../config/api';

function mockFetchOnce(body: any, status = 200) {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  });
}

const user = { id: 1, username: 'alice', email: 'alice@example.com', first_name: 'Alice', last_name: 'A' };

describe('AuthService', () => {
  // authService is a module-level singleton shared across every test in
  // this file, so each test must start from a clean, logged-out state.
  // logout() clears in-memory + persisted state unconditionally (it
  // swallows any network error), which is more reliable here than trying
  // to re-import a fresh module instance per test.
  beforeEach(async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });
    await authService.logout();
    await AsyncStorage.clear();
    globalThis.fetch = jest.fn();
  });

  it('login stores tokens and user, and flips isAuthenticated', async () => {
    mockFetchOnce({ access: 'access-1', refresh: 'refresh-1', user });

    const result = await authService.login('alice', 'password123');

    expect(result).toEqual(user);
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getCurrentUser()).toEqual(user);
    expect(await AsyncStorage.getItem('auth_access_token')).toBe('access-1');
    expect(await AsyncStorage.getItem('auth_refresh_token')).toBe('refresh-1');

    const [url, options] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/auth/token/');
    expect(JSON.parse(options.body)).toEqual({ username: 'alice', password: 'password123' });
  });

  it('register stores the tokens nested under `tokens`', async () => {
    mockFetchOnce({ user, profile: {}, tokens: { access: 'access-2', refresh: 'refresh-2' } });

    const result = await authService.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      password2: 'password123',
      first_name: 'Alice',
      last_name: 'A',
    });

    expect(result).toEqual(user);
    expect(authService.isAuthenticated()).toBe(true);
    expect(await AsyncStorage.getItem('auth_access_token')).toBe('access-2');
  });

  it('logout clears the session even if the server call fails', async () => {
    mockFetchOnce({ access: 'access-1', refresh: 'refresh-1', user });
    await authService.login('alice', 'password123');

    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    await authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBeNull();
    expect(await AsyncStorage.getItem('auth_access_token')).toBeNull();
  });

  it('notifies subscribers on login and logout', async () => {
    const listener = jest.fn();
    const unsubscribe = authService.subscribe(listener);

    mockFetchOnce({ access: 'access-1', refresh: 'refresh-1', user });
    await authService.login('alice', 'password123');
    expect(listener).toHaveBeenLastCalledWith(user);

    mockFetchOnce({ message: 'ok' });
    await authService.logout();
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
  });

  describe('withAuth', () => {
    it('retries once with a refreshed token after a 401', async () => {
      mockFetchOnce({ access: 'access-1', refresh: 'refresh-1', user });
      await authService.login('alice', 'password123');

      const request = jest
        .fn()
        .mockRejectedValueOnce(new ApiError('unauthorized', 401))
        .mockResolvedValueOnce('second-try-result');

      mockFetchOnce({ access: 'access-2', refresh: 'refresh-2' }); // token/refresh/ response

      const result = await authService.withAuth(request);

      expect(result).toBe('second-try-result');
      expect(request).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenNthCalledWith(1, 'access-1');
      expect(request).toHaveBeenNthCalledWith(2, 'access-2');
    });

    it('clears the session and rethrows if the refresh call itself fails', async () => {
      mockFetchOnce({ access: 'access-1', refresh: 'refresh-1', user });
      await authService.login('alice', 'password123');

      const request = jest.fn().mockRejectedValue(new ApiError('unauthorized', 401));

      mockFetchOnce({ detail: 'Token is invalid or expired' }, 401); // token/refresh/ fails

      await expect(authService.withAuth(request)).rejects.toThrow('unauthorized');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('bootstrap', () => {
    it('returns null and stores nothing when there is no persisted session', async () => {
      const result = await authService.bootstrap();
      expect(result).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('restores and re-validates a persisted session', async () => {
      await AsyncStorage.setItem('auth_access_token', 'stored-access');
      await AsyncStorage.setItem('auth_refresh_token', 'stored-refresh');
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));

      mockFetchOnce({ user, profile: {} }); // GET /auth/me/

      const result = await authService.bootstrap();

      expect(result).toEqual(user);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('clears a stale/expired persisted session', async () => {
      await AsyncStorage.setItem('auth_access_token', 'stale-access');
      await AsyncStorage.setItem('auth_refresh_token', 'stale-refresh');
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));

      mockFetchOnce({ detail: 'Token is invalid or expired' }, 401); // /auth/me/ fails

      const result = await authService.bootstrap();

      expect(result).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(await AsyncStorage.getItem('auth_access_token')).toBeNull();
    });
  });
});
