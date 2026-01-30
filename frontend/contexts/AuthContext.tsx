// contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';

// API URL
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// ================= TYPES =================

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
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

// ================= CONTEXT =================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ================= STORAGE KEYS =================

const STORAGE_KEYS = {
  TOKEN: 'snapshroom_access_token',
  USER: 'snapshroom_user',
};

// ================= AXIOS =================

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor to include Authorization header
api.interceptors.request.use(
  (config) => {
    const token = config.headers.Authorization?.replace('Bearer ', '');
    if (token) {
      console.log('Sending request with Authorization header');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized - token may be invalid');
    }
    return Promise.reject(error);
  }
);

// ================= PROVIDER =================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- HELPERS ----------
  const clearAuth = async () => {
    // Clear state immediately to prevent race conditions
    setUser(null);
    setAccessToken(null);
    delete api.defaults.headers.common.Authorization;
    
    // Then clear storage asynchronously
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
    ]);
  };

  const storeAuth = async (token: string, userData: User) => {
    console.log('Storing auth with token:', token?.substring(0, 20) + '...');
    
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(userData)
    );

    // Set authorization header
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log('Authorization header set:', api.defaults.headers.common.Authorization?.substring(0, 30) + '...');
    
    setAccessToken(token);
    setUser(userData);
    setError(null);
    console.log('Auth state updated');
  };

  // ---------- INIT ----------
  // Restore auth from storage on app start/refresh
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          console.log('Restored auth from storage:', userData.email);
          
          // Set authorization header
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          
          setAccessToken(token);
          setUser(userData);
          setError(null);
        } else {
          console.log('No auth data in storage');
        }
      } catch (err) {
        console.error('Error restoring auth:', err);
        // Clear state if there's an error
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  // ---------- LOGIN ----------
  const login = async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure clean state before login - remove any old authorization headers
      delete api.defaults.headers.common.Authorization;
      
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      await storeAuth(res.data.access_token, res.data.user);
    } catch (err) {
      let msg = 'Login failed';

      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- SIGNUP ----------
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
      });

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      // auto login
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (err) {
      let msg = 'Registration failed';

      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- LOGOUT ----------
  const logout = async () => {
    console.log('🔴 LOGOUT: user state before =', user ? user.email : 'null');
    setIsLoading(true);
    try {
      await clearAuth();
      console.log('🔴 LOGOUT: clearAuth completed');
    } catch (err) {
      console.error('🔴 LOGOUT ERROR:', err);
    } finally {
      setIsLoading(false);
      console.log('🔴 LOGOUT: Complete - user state after =', user ? user.email : 'null');
    }
  };

  // ---------- REFRESH USER ----------
  const refreshUser = async () => {
    try {
      if (!accessToken) {
        console.log('No access token, skipping user refresh');
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        console.log('User refreshed:', res.data.user.email);
        setUser(res.data.user);
        // Update stored user data
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(res.data.user)
        );
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const clearError = () => setError(null);

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

// ================= HOOK =================

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};

// ================= EXPORTS =================

export { api };
