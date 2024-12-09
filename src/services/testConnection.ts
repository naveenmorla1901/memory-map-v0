// src/services/testConnection.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { ensureTestUserLogin, getAuthToken } from './auth/testAuth';

const BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8002/api/v1'
    : 'http://localhost:8002/api/v1';

export const testBackendConnection = async () => {
    try {
        // First ensure test user is logged in
        const isLoggedIn = await ensureTestUserLogin();
        if (!isLoggedIn) {
            console.log('Failed to ensure test user login');
            return { connected: true, authenticated: false };
        }

        // Get authentication token
        const token = await getAuthToken();
        if (!token) {
            console.log('No auth token available');
            return { connected: true, authenticated: false };
        }

        console.log('Testing authenticated endpoint...', {
            url: `${BASE_URL}/test-auth/`,
            hasToken: !!token
        });

        const response = await axios.get(`${BASE_URL}/test-auth/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Test endpoint response:', response.data);
        return { connected: true, authenticated: true };
    } catch (error: any) {
        console.error('Connection test failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            return { connected: true, authenticated: false };
        }

        return { connected: false, authenticated: false };
    }
};