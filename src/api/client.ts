import { API_URL } from '../config';
import { sessionStore } from './session';

type ErrorKind = 'http' | 'network' | 'timeout';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ErrorKind;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, kind: ErrorKind = 'http', fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }

  /** First error for a form field, if the server rejected it. */
  field(name: string): string | undefined {
    const value = this.fieldErrors[name];
    return Array.isArray(value) ? value[0] : undefined;
  }

  get isOffline(): boolean {
    return this.kind !== 'http';
  }
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send the signed-in user's token (default true). */
  auth?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${API_URL}${path}${params ? `?${params}` : ''}`;
}

function friendlyHttpMessage(status: number, body: any): string {
  const detail = typeof body?.detail === 'string' ? body.detail : '';
  if (status === 429) {
    const seconds = detail.match(/(\d+) seconds?/)?.[1];
    return seconds
      ? `You're doing that a lot. Try again in ${seconds} second${seconds === '1' ? '' : 's'}.`
      : "You're doing that a lot. Try again in a moment.";
  }
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  if (detail) return detail;
  if (status === 404) return "That couldn't be found. It may have been deleted.";
  return 'Something went wrong. Please try again.';
}

async function send(path: string, options: RequestOptions, accessToken: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('This is taking too long. Check your connection and try again.', 0, 'timeout');
    }
    throw new ApiError("Can't reach Memory Map. Check your connection and try again.", 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(friendlyHttpMessage(response.status, body), response.status, 'http', body?.errors ?? {});
  }
  return body as T;
}

let refreshing: Promise<string | null> | null = null;

/**
 * Get a fresh access token. Single-flight, and rotation-safe: the iOS share
 * extension shares this session and may already have rotated the refresh
 * token, so re-read storage first and use its token if it's newer.
 */
function refreshAccessToken(expiredAccess: string | null): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const stored = await sessionStore.load();
      if (!stored) return null;
      if (stored.access !== expiredAccess) return stored.access;

      const response = await send('/auth/token/refresh/', { method: 'POST', body: { refresh: stored.refresh } }, null);
      if (response.status === 401 || response.status === 400) {
        await sessionStore.clear(); // Revoked or expired: signed out.
        return null;
      }
      const tokens = await parse<{ access: string; refresh?: string }>(response);
      await sessionStore.update({ access: tokens.access, refresh: tokens.refresh ?? stored.refresh });
      return tokens.access;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth ?? true;
  let access = useAuth ? (sessionStore.get()?.access ?? (await sessionStore.load())?.access ?? null) : null;

  let response = await send(path, options, access);
  if (response.status === 401 && useAuth) {
    access = await refreshAccessToken(access);
    if (!access) throw new ApiError('Your session has ended. Please sign in again.', 401);
    response = await send(path, options, access);
  }
  return parse<T>(response);
}
