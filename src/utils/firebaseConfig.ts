// src/utils/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: "AIzaSyBOKAdTRz8J-9QSu8P7DEyLd6NAqqN0STI",
  authDomain: "memory-map-78ad6.firebaseapp.com",
  databaseURL: "https://memory-map-78ad6-default-rtdb.firebaseio.com",
  projectId: "memory-map-78ad6",
  storageBucket: "memory-map-78ad6.firebasestorage.app",
  messagingSenderId: "293613109189",
  appId: "1:293613109189:web:d2decb21864327465255ac",
  measurementId: "G-DSD59LSN6W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Special handling for Android emulator
if (__DEV__ && Platform.OS === 'android') {
  console.log('Setting up Firebase Auth emulator for Android');
  // Use 10.0.2.2 for Android emulator
  connectAuthEmulator(auth, 'http://10.0.2.2:9099');
}

export { auth };
export const db = getFirestore(app);