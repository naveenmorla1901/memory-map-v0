import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOKAdTRz8J-9QSu8P7DEyLd6NAqqN0STI",
  authDomain: "memory-map-78ad6.firebaseapp.com",
  databaseURL: "https://memory-map-78ad6-default-rtdb.firebaseio.com",
  projectId: "memory-map-78ad6",
  storageBucket: "memory-map-78ad6.firebasestorage.app",
  messagingSenderId: "293613109189",
  appId: "1:293613109189:web:d2decb21864327465255ac",
  measurementId: "G-DSD59LSN6W"
};

let auth;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  // Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  // Test the authentication setup
  const testAuth = async () => {
    try {
      console.log('Testing authentication setup...');
      const userCredential = await signInWithEmailAndPassword(auth, 'morla.naveen1901@gmail.com', 'Login123$');
      console.log('Authentication test successful:', userCredential.user.uid);
    } catch (error) {
      console.error('Authentication test failed:', error.code, error.message);
    }
  };

  // Run the test
  testAuth();

} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { auth };