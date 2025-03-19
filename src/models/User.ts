export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
} 