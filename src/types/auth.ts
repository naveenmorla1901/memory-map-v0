// src/types/auth.ts
import { User as FirebaseUser } from 'firebase/auth';

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserCredential {
    user: FirebaseUser;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name: string;
}