// src/types/api.ts
import { User } from './models';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
export type AuthResponse = ApiResponse<AuthApiResponse>;
export interface AuthApiResponse extends ApiResponse<{
  user: User;
  token: string;
}> {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface LocationResponse extends ApiResponse<Location> {}
export interface LocationsResponse extends ApiResponse<Location[]> {}