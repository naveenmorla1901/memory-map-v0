//src/types/location.ts
export interface LocationInput {
    // Basic location information (required)
    name: string;
    latitude: number;
    longitude: number;
    description: string;
    address: string;
    category: string;
  
    // Metadata
    created_at?: string;
    updated_at?: string;
  }
  
  export interface Location extends LocationInput {
    id: string;
    sync_status: 'pending' | 'synced' | 'failed';
    version: number;
    deleted: boolean;
  }
  
  