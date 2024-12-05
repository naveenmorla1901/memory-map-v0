import { User } from './auth';

export interface FirebaseUserProfile {
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FirebaseResponse {
  user: User;
  token: string;
}