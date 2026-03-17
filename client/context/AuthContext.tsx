import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../lib/query-client';
import {
  auth,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  resetPassword as firebaseResetPassword,
  signInWithGooglePopup,
  signInWithFacebookPopup,
  onAuthStateChanged,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
  clearRecaptcha,
} from '../lib/firebase';
import { Platform } from 'react-native';
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  profilePhoto?: string;
  profileImage?: string;
  coins: number;
  trophies: number;
  awards: number;
  subscriptionTier: string;
  bio?: string;
  age?: number;    // YE ADD KARO
  gender?: string; // YE ADD KARO
  location?: string;
  isVendor: boolean;
  createdAt: string;
  dailySpinsLeft?: number;
  lastSpinDate?: string;
  authProvider?: string;
  firebaseUid?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  sendPhoneCode: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneCode: (code: string, email?: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = getApiUrl();

  const syncUserWithBackend = useCallback(async (firebaseToken: string, firebaseUser: any) => {
    try {
      const response = await fetch(new URL('/api/auth/firebase', apiUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          profileImage: firebaseUser.photoURL,
          firebaseUid: firebaseUser.uid,
          authProvider: firebaseUser.providerData?.[0]?.providerId || 'password',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(firebaseToken);
        await AsyncStorage.setItem('auth_token', firebaseToken);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to sync user' };
      }
    } catch (error) {
      console.error('Sync user error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [apiUrl]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // ✅ 1. Trust token immediately (UNBLOCK UI)
      setToken(storedToken);
      setIsLoading(false);

      // ✅ 2. Verify in background (DON'T await)
      fetch(new URL('/api/auth/me', apiUrl).toString(), {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) setUser(data);
          else AsyncStorage.removeItem('auth_token');
        })
        .catch(() => { });
    } catch (error) {
      console.error('Error loading auth:', error);
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        // ✅ Trust Firebase auth instantly to unblock UI logic based on Token Presence
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        await AsyncStorage.setItem('auth_token', idToken);

        // Fetch user data from backend but do NOT block UI rendering waiting for it
        fetch(new URL('/api/auth/me', apiUrl).toString(), {
          headers: { Authorization: `Bearer ${idToken}` },
        })
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (mounted && data) {
              setUser(data);
            }
          })
          .catch(() => { });
      } else {
        // Clear auth state smoothly
        setToken(null);
        setUser(null);
        AsyncStorage.removeItem('auth_token');
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [apiUrl]);

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const input = emailOrUsername.trim().toLowerCase();
      let email = input;

      // If username (no @), resolve to email. We start resolving IMMEDIATELY
      // and await only when we actually need the email (just before Firebase call).
      let emailResolutionPromise: Promise<string | null> | null = null;
      if (!input.includes('@')) {
        emailResolutionPromise = fetch(new URL('/api/auth/resolve-username', apiUrl).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: input }),
        })
          .then(res => res.ok ? res.json().then((d: any) => d.email as string) : null)
          .catch(() => null);
      }

      // Await resolution only when needed
      if (emailResolutionPromise) {
        const resolvedEmail = await emailResolutionPromise;
        if (!resolvedEmail) {
          return { success: false, error: 'No account found with this username' };
        }
        email = resolvedEmail;
      }

      const userCredential = await signInWithEmail(email, password);
      const firebaseToken = await userCredential.user.getIdToken();

      // ✅ 1. Optimistically set auth state (INSTANT UI)
      setToken(firebaseToken);
      await AsyncStorage.setItem('auth_token', firebaseToken);

      // Minimal temporary user (UI unblock)
      setUser({
        id: 'temp',
        email: userCredential.user.email || '',
        username: '',
        fullName: userCredential.user.displayName || '',
        coins: 0,
        trophies: 0,
        awards: 0,
        subscriptionTier: 'free',
        isVendor: false,
        createdAt: new Date().toISOString(),
      });

      // ✅ 2. Backend sync in background (DON'T await)
      syncUserWithBackend(firebaseToken, userCredential.user);

      // ✅ 3. Return success immediately
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';

      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      return { success: false, error: errorMessage };
    }
  };

  const loginWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const userCredential = await signInWithGooglePopup();
      if (!userCredential) {
        return { success: false, error: 'Cancelled' };
      }

      const token = await userCredential.user.getIdToken();

      // Optimistic auth
      setToken(token);
      await AsyncStorage.setItem('auth_token', token);

      setUser({
        id: 'temp',
        email: userCredential.user.email || '',
        fullName: userCredential.user.displayName || '',
        username: '',
        coins: 0,
        trophies: 0,
        awards: 0,
        subscriptionTier: 'free',
        isVendor: false,
        createdAt: new Date().toISOString(),
        authProvider: 'google',
      });

      syncUserWithBackend(token, userCredential.user);
      return { success: true };
    }

    // ✅ ANDROID path
    return { success: false, error: 'ANDROID_GOOGLE_AUTH' };
  };

  const loginWithFacebook = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithFacebookPopup();
      if (!userCredential) {
        return { success: false, error: 'Facebook sign-in was cancelled' };
      }

      const firebaseToken = await userCredential.user.getIdToken();
      return await syncUserWithBackend(firebaseToken, userCredential.user);
    } catch (error: any) {
      console.error('Facebook login error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      if (error.code === 'auth/popup-blocked') {
        return { success: false, error: 'Pop-up was blocked. Please allow pop-ups.' };
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        return { success: false, error: 'An account already exists with this email using a different sign-in method.' };
      }

      return { success: false, error: 'Facebook login failed. Please try again.' };
    }
  };

  const register = async (registerData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signUpWithEmail(registerData.email, registerData.password);
      const firebaseToken = await userCredential.user.getIdToken();

      const response = await fetch(new URL('/api/auth/firebase-register', apiUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          email: registerData.email,
          username: registerData.username,
          fullName: registerData.fullName,
          firebaseUid: userCredential.user.uid,
          authProvider: 'password',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        await userCredential.user.delete();
        return { success: false, error: error.error || 'Registration failed' };
      }

      const data = await response.json();
      await AsyncStorage.setItem('auth_token', firebaseToken);
      setUser(data.user);
      setToken(firebaseToken);
      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      let errorMessage = 'Registration failed';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    const currentToken =
      token || (auth.currentUser ? await auth.currentUser.getIdToken() : null);
    if (!currentToken) return;

    try {
      const response = await fetch(new URL('/api/auth/me', apiUrl).toString(), {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await firebaseResetPassword(email);
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to send reset email';

      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      }

      return { success: false, error: errorMessage };
    }
  };

  const sendPhoneCode = async (phoneNumber: string, recaptchaContainerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const appVerifier = setupRecaptcha(recaptchaContainerId);
      await sendPhoneOTP(phoneNumber, appVerifier);
      return { success: true };
    } catch (error: any) {
      console.error('Send phone code error:', error);
      clearRecaptcha();
      let errorMessage = 'Failed to send verification code';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Use +1234567890';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      }

      return { success: false, error: errorMessage };
    }
  };

  const verifyPhoneCode = async (code: string, email?: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await verifyPhoneOTP(code);
      if (!userCredential) {
        return { success: false, error: 'Verification failed' };
      }

      const firebaseToken = await userCredential.user.getIdToken();
      const phoneNumber = userCredential.user.phoneNumber;

      const response = await fetch(new URL('/api/auth/firebase', apiUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          email: email || `${phoneNumber?.replace(/\+/g, '')}@phone.realdream.app`,
          fullName: username || 'Phone User',
          firebaseUid: userCredential.user.uid,
          authProvider: 'phone',
          phoneNumber: phoneNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(firebaseToken);
        await AsyncStorage.setItem('auth_token', firebaseToken);
        clearRecaptcha();
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to sync user' };
      }
    } catch (error: any) {
      console.error('Verify phone code error:', error);
      clearRecaptcha();
      let errorMessage = 'Verification failed';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      }

      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithFacebook,
        sendPhoneCode,
        verifyPhoneCode,
        register,
        logout,
        refreshUser,
        updateUser,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
