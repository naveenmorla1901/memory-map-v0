// src/services/auth/authService.ts
import { auth } from '../../utils/firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class AuthService {
    async checkConnection() {
        const netInfo = await NetInfo.fetch();
        console.log('Connection status:', netInfo);
        return netInfo.isConnected && netInfo.isInternetReachable;
    }
    async login(email: string, password: string) {
        try {
            const isConnected = await this.checkConnection();
            if (!isConnected) {
                Alert.alert(
                    'No Internet Connection',
                    'Please check your internet connection and try again.'
                );
                return null;
            }

            console.log('Attempting login with Firebase...', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful');
            return userCredential.user;
        } catch (error: any) {
            console.error('Firebase login error:', error.code, error.message);
            this.handleAuthError(error);
            throw error;
        }
    }
    
    async register(email: string, password: string) {
        try {
            console.log('Attempting to create user with Firebase...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Registration successful:', userCredential.user.email);
            return userCredential.user;
        } catch (error: any) {
            console.error('Firebase registration error:', error);
            
            switch (error.code) {
                case 'auth/network-request-failed':
                    Alert.alert(
                        'Connection Error',
                        'Please check your internet connection and try again.'
                    );
                    break;
                case 'auth/email-already-in-use':
                    Alert.alert(
                        'Registration Failed',
                        'This email is already registered.'
                    );
                    break;
                case 'auth/weak-password':
                    Alert.alert(
                        'Registration Failed',
                        'Password should be at least 6 characters.'
                    );
                    break;
                default:
                    Alert.alert(
                        'Registration Error',
                        'An unexpected error occurred. Please try again.'
                    );
            }
            throw error;
        }
    }

    async signOut() {
        try {
            await firebaseSignOut(auth);
            console.log('Successfully signed out');
        } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert(
                'Sign Out Error',
                'Failed to sign out. Please try again.'
            );
            throw error;
        }
    }
    private handleAuthError(error: any) {
        switch (error.code) {
            case 'auth/network-request-failed':
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to authentication server. Please check your internet connection.'
                );
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                Alert.alert(
                    'Login Failed',
                    'Invalid email or password.'
                );
                break;
            default:
                Alert.alert(
                    'Error',
                    'An unexpected error occurred. Please try again.'
                );
                break;
        }
    }
}

export const authService = new AuthService();