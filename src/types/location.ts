export interface LocationType {
    id?: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    category?: string;
    description?: string;
    isInstagramSource?: boolean;
    instagramUrl?: string;
    savedAt?: string;
    updatedAt?: string;
  }
  
  export interface SearchResult {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }
  
  export interface LocationViewProps {
    location: LocationType;
    onSelect?: (location: LocationType) => void;
    onDelete?: (locationId: string) => void;
  }
  
  export interface MapViewport {
    center: [number, number];
    zoom: number;
  }