// src/services/api/apiConfig.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
    baseURL: Platform.OS === 'android' ? 'http://10.0.2.2:8002/api/v1' : 'http://localhost:8002/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
};

// Helper to get auth token
export const getAuthHeader = async () => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
        console.error('Error getting auth token:', error);
        return {};
    }
};