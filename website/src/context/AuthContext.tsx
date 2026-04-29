import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        
        // Sync with backend to get user details (coins, etc)
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            setUser({ email: firebaseUser.email, uid: firebaseUser.uid });
          }
        } catch (err) {
          setUser({ email: firebaseUser.email, uid: firebaseUser.uid });
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const creds = await signInWithEmailAndPassword(auth, email, password);
    return creds;
  };

  const loginWithGoogle = async () => {
    const creds = await signInWithPopup(auth, googleProvider);
    return creds;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
