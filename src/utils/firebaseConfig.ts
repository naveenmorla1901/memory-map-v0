// src/utils/firebaseConfig.ts
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const firestore = getFirestore();