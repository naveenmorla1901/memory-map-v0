import { LocationType } from './location';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
};

export type BottomTabParamList = {
  Map: {
    location?: LocationType;
    editLocation?: boolean;
    fromScreen?: string;
    mode?: string;
  } | undefined;
  Saved: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}