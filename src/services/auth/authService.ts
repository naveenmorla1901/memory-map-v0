// src/services/auth/authService.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthResponse {
    user: FirebaseAuthTypes.User | null;
    error?: string;
    success?: boolean;
}

interface UserProfile {
    displayName?: string;
    photoURL?: string;
}

class AuthService {
    private static instance: AuthService;
    private currentUser: FirebaseAuthTypes.User | null = null;

    private constructor() {
        auth().onAuthStateChanged((user) => {
            this.currentUser = user;
        });
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            console.log('Starting login process...');
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            await this.persistAuthState(userCredential);
            return { user: userCredential.user, success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            return { user: null, error: error.message };
        }
    }

    async register(email: string, password: string, profile?: UserProfile): Promise<AuthResponse> {
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;

            if (profile) {
                await userCredential.user.updateProfile(profile);
            }

            await this.persistAuthState(userCredential);
            return { user: userCredential.user, success: true };
        } catch (error: any) {
            console.error('Registration error:', error);
            return { user: null, error: error.message };
        }
    }

    async signOut(): Promise<AuthResponse> {
        try {
            await auth().signOut();
            this.currentUser = null;
            await AsyncStorage.removeItem('userData');
            return { user: null, success: true };
        } catch (error: any) {
            console.error('Sign out error:', error);
            return { user: null, error: error.message };
        }
    }

    async resetPassword(email: string): Promise<AuthResponse> {
        try {
            await auth().sendPasswordResetEmail(email);
            return { user: null, success: true };
        } catch (error: any) {
            console.error('Password reset error:', error);
            return { user: null, error: error.message };
        }
    }

    getCurrentUser(): FirebaseAuthTypes.User | null {
        return this.currentUser || auth().currentUser;
    }

    isAuthenticated(): boolean {
        return !!this.getCurrentUser();
    }

    async updateUserProfile(profile: UserProfile): Promise<void> {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No authenticated user');

        try {
            await user.updateProfile(profile);
            await this.persistAuthState({ user } as FirebaseAuthTypes.UserCredential);
        } catch (error) {
            console.error('Profile update error:', error);
            throw new Error('Failed to update profile');
        }
    }

    private async persistAuthState(userCredential: FirebaseAuthTypes.UserCredential): Promise<void> {
        try {
            const userData = {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                photoURL: userCredential.user.photoURL
            };
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Error persisting auth state:', error);
            throw error;
        }
    }
}

export const authService = AuthService.getInstance();