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

// ================= PROVIDER =================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- INIT ----------
  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (token && userStr) {
          setAccessToken(token);
          setUser(JSON.parse(userStr));
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ---------- HELPERS ----------
  const storeAuth = async (token: string, userData: User) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(userData)
    );

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setAccessToken(token);
    setUser(userData);
    setError(null);
  };

  const clearAuth = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
    ]);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setAccessToken(null);
  };

  // ---------- LOGIN ----------
  const login = async ({ email, password }: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
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
        password: data.password,
        confirm_password: data.confirmPassword,
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
    setIsLoading(true);
    await clearAuth();
    setIsLoading(false);
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
