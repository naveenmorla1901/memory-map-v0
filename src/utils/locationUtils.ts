// src/utils/locationUtils.ts

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };
  
  export const formatDistance = (miles: number): string => {
    if (miles < 0.1) {
      return 'Less than 0.1 mile away';
    } else if (miles < 1) {
      return `${(miles * 5280).toFixed(0)} feet away`;
    } else {
      return `${miles.toFixed(1)} miles away`;
    }
  };