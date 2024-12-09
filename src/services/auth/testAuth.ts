// src/services/auth/testAuth.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8002/api/v1'
    : 'http://localhost:8002/api/v1';

const TEST_CREDENTIALS = {
    username: 'nmorla',    // Using just username as the backend expects
    password: 'Login123$'
};

export const getAuthToken = async () => {
    try {
        return await AsyncStorage.getItem('authToken');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

export const ensureTestUserLogin = async () => {
    try {
        // Using the correct endpoint path
        const url = `${BASE_URL}/auth/token/`;
        console.log('Attempting test user login at:', url);
        console.log('With credentials:', TEST_CREDENTIALS);
        
        const response = await axios.post(url, TEST_CREDENTIALS);
        
        console.log('Login response:', response.data);

        if (response.data.access) {
            await AsyncStorage.setItem('authToken', response.data.access);
            console.log('Test user login successful');
            return true;
        }
        return false;
    } catch (error: any) {
        console.error('Test user login failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: `${BASE_URL}/auth/token/`
        });
        return false;
    }
};