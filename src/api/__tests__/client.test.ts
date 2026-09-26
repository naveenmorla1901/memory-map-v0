import type { Session } from '../session';

// An in-mockMemory stand-in for the keychain, shared with "another process"
// (the iOS share extension) through `mockStored`.
let mockStored: Session | null = null;
let mockMemory: Session | null = null;
const mockListeners = new Set<(session: Session | null) => void>();

jest.mock('../session', () => ({
  sessionStore: {
    load: jest.fn(async () => {
      mockMemory = mockStored;
      return mockMemory;
    }),
    get: jest.fn(() => mockMemory),
    set: jest.fn(async (session: Session) => {
      mockMemory = session;
      mockStored = session;
    }),
    update: jest.fn(async (patch: Partial<Session>) => {
      mockMemory = { ...(mockMemory as Session), ...patch };
      mockStored = mockMemory;
    }),
    clear: jest.fn(async () => {
      mockMemory = null;
      mockStored = null;
      mockListeners.forEach((listener) => listener(null));
    }),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../config', () => ({ API_URL: 'https://api.test/api/v1' }));

import { ApiError, request } from '../client';

const user = { id: 1, email: 'a@b.c', name: 'A', first_name: 'A', last_name: '', date_joined: '' };

function reply(status: number, body?: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)) } as Response);
}

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  fetchMock.mockReset();
  mockStored = { access: 'old-access', refresh: 'old-refresh', user };
  mockMemory = mockStored;
});

const authHeader = (call: number) => fetchMock.mock.calls[call][1].headers.Authorization;

describe('request', () => {
  it('sends JSON with the access token', async () => {
    fetchMock.mockReturnValueOnce(reply(200, [{ id: 'x' }]));
    await expect(request('/locations/', { query: { search: 'tacos', empty: '' } })).resolves.toEqual([{ id: 'x' }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/v1/locations/?search=tacos');
    expect(authHeader(0)).toBe('Bearer old-access');
  });

  it('refreshes an expired token once and retries', async () => {
    fetchMock
      .mockReturnValueOnce(reply(401, { detail: 'expired' }))
      .mockReturnValueOnce(reply(200, { access: 'new-access', refresh: 'new-refresh' }))
      .mockReturnValueOnce(reply(200, { ok: true }));
    await expect(request('/auth/me/')).resolves.toEqual({ ok: true });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refresh: 'old-refresh' });
    expect(authHeader(2)).toBe('Bearer new-access');
    expect(mockStored).toMatchObject({ access: 'new-access', refresh: 'new-refresh' });
  });

  it('shares one refresh between concurrent requests', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/token/refresh/')) return reply(200, { access: 'new-access', refresh: 'new-refresh' });
      return mockMemory?.access === 'new-access' ? reply(200, {}) : reply(401);
    });
    // Both requests go out with the old token before either refresh completes.
    mockMemory = mockStored;
    await Promise.all([request('/a/'), request('/b/')]);
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/token/refresh/'));
    expect(refreshCalls).toHaveLength(1);
  });

  it("uses the share extension's newer token instead of refreshing again", async () => {
    // The extension rotated the tokens while the app held the old ones in mockMemory.
    mockStored = { access: 'ext-access', refresh: 'ext-refresh', user };
    fetchMock.mockReturnValueOnce(reply(401)).mockReturnValueOnce(reply(200, { ok: true }));
    await request('/locations/');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authHeader(1)).toBe('Bearer ext-access');
  });

  it('signs out when the refresh token is rejected', async () => {
    fetchMock.mockReturnValueOnce(reply(401)).mockReturnValueOnce(reply(401, { detail: 'Token is blacklisted' }));
    await expect(request('/locations/')).rejects.toMatchObject({ status: 401 });
    expect(mockStored).toBeNull();
  });

  it('keeps the session when refreshing fails because the phone is offline', async () => {
    fetchMock.mockReturnValueOnce(reply(401)).mockReturnValueOnce(Promise.reject(new TypeError('Network request failed')));
    await expect(request('/locations/')).rejects.toMatchObject({ kind: 'network' });
    expect(mockStored).not.toBeNull();
  });

  it('turns errors into readable messages with field errors', async () => {
    fetchMock.mockReturnValueOnce(reply(400, { detail: 'Email: already in use.', errors: { email: ['already in use.'] } }));
    const error: ApiError = await request<never>('/auth/register/', { method: 'POST', body: {}, auth: false }).catch((e: unknown) => e as ApiError);
    expect(error.message).toBe('Email: already in use.');
    expect(error.field('email')).toBe('already in use.');

    fetchMock.mockReturnValueOnce(reply(429, { detail: 'Request was throttled. Expected available in 42 seconds.' }));
    await expect(request('/x/', { auth: false })).rejects.toThrow('Try again in 42 seconds.');

    fetchMock.mockReturnValueOnce(reply(502, '<html>bad gateway</html>'));
    await expect(request('/x/', { auth: false })).rejects.toThrow('Something went wrong on our side');
  });

  it('reports network failures as offline', async () => {
    fetchMock.mockReturnValueOnce(Promise.reject(new TypeError('Network request failed')));
    const error: ApiError = await request<never>('/x/', { auth: false }).catch((e: unknown) => e as ApiError);
    expect(error.isOffline).toBe(true);
    expect(error.message).toMatch(/Can't reach Memory Map/);
  });
});
