import { LocationType } from '../types/location';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  SavedLocations: undefined;
  MapScreen: { location?: LocationType };
  LocationDetails: { location: LocationType };
};
