import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import type { CategoryKey } from '../theme/categories';

/** A place that isn't saved yet: from search, a dropped pin, or a reel. */
export interface PlaceDraft {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: CategoryKey;
  instagram_url?: string;
}

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export type TabParamList = {
  Map: { focusPlaceId?: string } | undefined;
  Places: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Signed out
  Welcome: undefined;
  SignIn: { email?: string } | undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string } | undefined;
  // Signed in
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PlaceDetail: { placeId: string };
  /** Edit a saved place (placeId) or finish saving a new one (draft). `picked` comes back from PickLocation. */
  EditPlace: { placeId?: string; draft?: PlaceDraft; picked?: PickedLocation };
  AddPlace: { query?: string } | undefined;
  /** 'create' starts a new place at the picked point; 'return' hands the point back to EditPlace. */
  PickLocation: { initial?: { latitude: number; longitude: number }; mode: 'create' | 'return' };
  Share: { url: string };
  EditProfile: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  ShareHelp: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
