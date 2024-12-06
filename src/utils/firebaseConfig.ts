import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBOKAdTRz8J-9QSu8P7DEyLd6NAqqN0STI",
  authDomain: "memory-map-78ad6.firebaseapp.com",
  projectId: "memory-map-78ad6",
  databaseURL: "https://memory-map-78ad6-default-rtdb.firebaseio.com",
  storageBucket: "memory-map-78ad6.firebasestorage.app",
  messagingSenderId: "293613109189",
  appId: "1:293613109189:web:d2decb21864327465255ac",
  measurementId: "G-DSD59LSN6W"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
