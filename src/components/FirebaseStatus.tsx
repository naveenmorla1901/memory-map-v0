// src/components/FirebaseStatus.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const FirebaseStatus = () => {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // Simple Firebase connectivity test
        const auth = getAuth();
        await signInAnonymously(auth);
        setStatus('Firebase connected');
      } catch (error: any) {
        setStatus(`Firebase error: ${error.code}`);
        console.error('Firebase test error:', error);
      }
    };

    checkFirebase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Firebase Status: {status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 5,
  },
  status: {
    fontSize: 12,
    color: '#666',
  },
});