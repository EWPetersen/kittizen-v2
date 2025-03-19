import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, AuthState } from '../models/User';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  anonymousLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setAuthState(prev => ({
        ...prev,
        user: user ? mapFirebaseUserToUser(user) : null,
        loading: false
      }));
    });

    return () => unsubscribe();
  }, []);

  const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime).getTime() : Date.now()
    };
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const anonymousLogin = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInAnonymously(auth);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const value = {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    logout,
    anonymousLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 