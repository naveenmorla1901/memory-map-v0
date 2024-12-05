// src/types/models.ts
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface Location {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    description?: string;
    category?: string;
    isInstagramSource?: boolean;
    instagramUrl?: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  }