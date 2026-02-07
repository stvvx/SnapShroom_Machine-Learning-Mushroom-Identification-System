// contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ==================================================
// ENV & API URL
// ==================================================
const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.endsWith('/api')
    ? process.env.EXPO_PUBLIC_API_URL
    : `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:5000'}/api`;

console.log('Using API URL:', API_URL);

// ==================================================
// TYPES
// ==================================================
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
  profileImage?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  accessToken: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// ==================================================
// STORAGE KEYS
// ==================================================
const STORAGE_KEYS = {
  TOKEN: 'snapshroom_access_token',
  USER: 'snapshroom_user',
};

// ==================================================
// AXIOS INSTANCE
// ==================================================
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor (fixed TS issue)
api.interceptors.request.use(
  (config) => {
    const authHeader = config.headers?.['Authorization'] as string | undefined;
    if (authHeader) {
      console.log('Sending request with Authorization header');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized - token may be invalid');
    }
    return Promise.reject(error);
  }
);

// ==================================================
// CONTEXT
// ==================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Helpers
  // -------------------------
  const clearAuth = async () => {
    setUser(null);
    setAccessToken(null);
    delete api.defaults.headers.common.Authorization;
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  };

  const storeAuth = async (token: string, userData: User) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setAccessToken(token);
    setUser(userData);
    setError(null);
  };

  // -------------------------
  // Restore auth on start
  // -------------------------
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          setAccessToken(token);
          setUser(userData);
          setError(null);
          console.log('Restored auth from storage:', userData.email);
        }
      } catch (err) {
        console.error('Error restoring auth:', err);
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      delete api.defaults.headers.common.Authorization;

      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      }, {
        withCredentials: true,
      });

      if (!res.data.success) throw new Error(res.data.message);

      await storeAuth(res.data.access_token, res.data.user);
    } catch (err: any) {
      let msg = 'Login failed';
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || msg;
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // SIGNUP
  // -------------------------
  const signup = async (data: SignupData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        email: data.email.trim().toLowerCase(),
        password: data.password.trim(),
        confirmPassword: data.confirmPassword.trim(),
        username: data.username.trim(),
        name: data.name || data.username.trim(),
      }, {
        withCredentials: true,
      });

      if (!res.data.success) throw new Error(res.data.message);

      // auto login
      await login({ email: data.email, password: data.password });
    } catch (err: any) {
      let msg = 'Registration failed';
      if (axios.isAxiosError(err)) msg = err.response?.data?.message || msg;
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = async () => {
    setIsLoading(true);
    try {
      await clearAuth();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // REFRESH USER
  // -------------------------
  const refreshUser = async () => {
    try {
      if (!accessToken) return;

      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const clearError = () => setError(null);

  // -------------------------
  // PROVIDER
  // -------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        login,
        signup,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================================================
// HOOK
// ==================================================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
