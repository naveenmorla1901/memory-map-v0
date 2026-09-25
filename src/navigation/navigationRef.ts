import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Lets code outside the component tree (the Android share-intent listener
// in AppNavigator's effect) navigate imperatively once the navigator is
// ready, rather than only via declarative screen props.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
