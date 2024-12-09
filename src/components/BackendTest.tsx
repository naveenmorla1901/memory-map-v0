// src/components/BackendTest.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { testBackendConnection } from '../services/testConnection';
import { ensureTestUserLogin } from '../services/auth/testAuth';

export const BackendTest = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        // Try to login test user when component mounts
        ensureTestUserLogin().then(success => {
            setIsAuthenticated(success || false); // Provide a default value of false if success is undefined
            console.log('Initial auth status:', success);
        });
    }, []);

    const handleTest = async () => {
        setIsLoading(true);
        try {
            const result = await testBackendConnection();
            Alert.alert(
                'Connection Test',
                result.connected 
                    ? (result.authenticated 
                        ? 'Successfully connected and authenticated!' 
                        : 'Connected but authentication failed')
                    : 'Failed to connect to backend'
            );
        } catch (error) {
            console.error('Test execution error:', error);
            Alert.alert('Error', 'Failed to execute test');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.status}>
                Auth Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}
            </Text>
            <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleTest}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Test Backend Connection</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => 
                    ensureTestUserLogin().then(success => setIsAuthenticated(success ?? false)) // Use nullish coalescing
                }
            >
                <Text style={styles.loginButtonText}>
                    Login Test User
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    status: {
        textAlign: 'center',
        marginBottom: 10,
        color: '#666',
    },
    button: {
        backgroundColor: '#FF4B55',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginButton: {
        padding: 10,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FF4B55',
        fontSize: 14,
    }
});