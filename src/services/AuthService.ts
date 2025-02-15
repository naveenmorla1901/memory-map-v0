import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword,
  signOut,
  User,
  AuthError
} from 'firebase/auth';

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  // Testing auto-login method
  async login(email: string = 'morla.naveen1901@gmail.com', password: string = 'Login123$'): Promise<AuthResponse> {
    try {
      console.log('Starting login process...');
      
      if (!auth) {
        throw new Error('Auth is not initialized');
      }

      console.log('Attempting login with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, getting token...');
      
      const token = await userCredential.user.getIdToken();
      console.log('Token retrieved successfully');
      
      return {
        user: userCredential.user,
        token
      };
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error details:', {
        code: authError.code,
        message: authError.message,
        fullError: error
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Auth is not initialized');
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth?.currentUser || null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}

export const authService = new AuthService();