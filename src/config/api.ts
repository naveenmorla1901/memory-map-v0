//src/config/api.ts
import Constants from 'expo-constants';

// Resolve the backend base URL from app.config extra (EXPO_PUBLIC_API_URL / API_URL env),
// falling back to the Android emulator's loopback alias to the host machine.
// Physical devices and iOS simulators need this overridden to your machine's LAN IP.
const DEFAULT_API_URL = 'http://10.0.2.2:8002/api/v1';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) || DEFAULT_API_URL;

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(body: any, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === 'string') return body;
  if (body.error) return body.error;
  if (body.detail) return body.detail;
  // DRF validation errors: { field: ["message", ...] }
  const firstKey = Object.keys(body)[0];
  if (firstKey && Array.isArray(body[firstKey])) {
    return `${firstKey}: ${body[firstKey][0]}`;
  }
  return fallback;
}

/**
 * Thin fetch wrapper: builds the URL, attaches JSON headers, and normalizes
 * error responses into ApiError. Auth headers/refresh are handled by the
 * caller (AuthService) to avoid a circular import between the two services.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(body, `Request failed (${response.status})`), response.status, body);
  }

  return body;
}
