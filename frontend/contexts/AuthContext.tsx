// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import axios, { AxiosError } from 'axios';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
console.log('AuthContext: Using API URL:', API_URL);

// User type definition
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
  subscription?: {
    type: 'free' | 'premium' | 'pro';
    expiresAt?: Date;
  };
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
  };
}

// Login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Signup data type
export interface SignupData {
  email: string;
  password: string;
  username: string;
  name?: string;
  confirmPassword?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
  error: string | null;
  accessToken: string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'snapshroom_user_token',
  REFRESH_TOKEN: 'snapshroom_refresh_token',
  USER_DATA: 'snapshroom_user_data',
  SESSION_EXPIRY: 'snapshroom_session_expiry',
};

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...');
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userDataStr) {
        console.log('Found stored auth data');
        const userData = JSON.parse(userDataStr);
        
        // Set user and token
        setUser(userData);
        setAccessToken(token);
        
        // Set default axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Optional: Validate token with backend
        try {
          // You could add a token validation endpoint
          // await api.get('/auth/validate');
          console.log('Auth initialized successfully');
        } catch (validationError) {
          console.log('Token validation failed, clearing auth data');
          await clearAuthData();
        }
      } else {
        console.log('No stored auth data found');
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all auth data
  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.SESSION_EXPIRY,
      ]);
      
      setUser(null);
      setAccessToken(null);
      delete api.defaults.headers.common['Authorization'];
      
      console.log('Auth data cleared');
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  };

  // Store auth data
  const storeAuthData = async (token: string, refreshToken: string, userData: User) => {
    try {
      console.log('Storing auth data for user:', userData.email);
      
      // Store tokens and user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      // Set session expiry (24 hours from now)
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiry.toISOString());
      
      // Update state
      setUser(userData);
      setAccessToken(token);
      setError(null);
      
      // Set default axios header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Auth data stored successfully');
    } catch (err) {
      console.error('Error storing auth data:', err);
      throw new Error('Failed to save authentication data');
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login for:', credentials.email);
      
      const response = await api.post('/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.access_token) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          name: response.data.user.name,
          email_verified: response.data.user.email_verified,
          role: response.data.user.role,
          created_at: response.data.user.created_at
        };
        
        await storeAuthData(
          response.data.access_token,
          response.data.refresh_token || response.data.access_token,
          userData
        );
        
        console.log('Login successful');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          // Server responded with error status
          const errorData = axiosError.response.data as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else if (axiosError.request) {
          // Request was made but no response
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (data: SignupData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting signup for:', data.email);
      console.log('Full signup data:', data);
      
      const response = await api.post('/auth/register', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        username: data.username.trim(),
        name: data.name || data.username.trim(),
        confirm_password: data.confirmPassword
      });
      
      console.log('Signup response:', response.data);
      
      if (response.data.success) {
        // Auto-login after successful registration
        console.log('Registration successful, attempting auto-login...');
        await login({
          email: data.email,
          password: data.password
        });
        
        console.log('Signup and auto-login successful');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          const errorData = axiosError.response.data as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Handle specific backend errors
          if (axiosError.response.status === 409) {
            if (errorData.message?.includes('Email')) {
              errorMessage = 'Email already registered. Please use a different email or login.';
            } else if (errorData.message?.includes('Username')) {
              errorMessage = 'Username already taken. Please choose a different username.';
            }
          }
        } else if (axiosError.request) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      console.log('Logging out...');
      
      // Optional: Call backend logout endpoint
      if (accessToken) {
        try {
          await api.post('/auth/logout');
        } catch (logoutError) {
          console.log('Backend logout failed, continuing with client logout');
        }
      }
      
      // Clear local storage
      await clearAuthData();
      setError(null);
      
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      console.log('Updating user profile...');
      
      // Update on backend
      const response = await api.put('/auth/profile', updates);
      
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user };
        
        // Update local state
        setUser(updatedUser);
        
        // Update stored user data
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        
        console.log('Profile updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      
      let errorMessage = 'Failed to update profile';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          const errorData = axiosError.response.data as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Requesting password reset for:', email);
      
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        Alert.alert(
          'Password Reset',
          'If an account exists with this email, you will receive password reset instructions shortly.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          const errorData = axiosError.response.data as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else if (axiosError.request) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check session expiry
  const checkSessionExpiry = async () => {
    try {
      const expiryString = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
      
      if (expiryString) {
        const expiry = new Date(expiryString);
        const now = new Date();
        
        // If session expired within last hour, try to refresh
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        
        if (expiry < oneHourAgo) {
          console.log('Session expired, attempting refresh...');
          await refreshAuthToken();
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  // Refresh token
  const refreshAuthToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (refreshToken && user) {
        console.log('Refreshing auth token...');
        
        const response = await api.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        if (response.data.success && response.data.access_token) {
          await storeAuthData(
            response.data.access_token,
            response.data.refresh_token || response.data.access_token,
            user
          );
          
          console.log('Token refreshed successfully');
          return true;
        }
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, logout user
      await clearAuthData();
    }
    return false;
  };

  // Add axios interceptor for token refresh
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // You could add request logging here
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await refreshAuthToken();
            if (refreshed) {
              // Retry the original request with new token
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await clearAuthData();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check session every 30 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(checkSessionExpiry, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    signup,
    logout,
    updateUser,
    forgotPassword,
    clearError,
    error,
    accessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes (optional)
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthenticatedComponent = (props: P) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
      // You can return a loading screen here
      return null;
    }
    
    if (!user) {
      // Redirect to login or show auth screen
      // This would work with navigation libraries
      return null;
    }
    
    return <Component {...props} />;
  };
  
  return AuthenticatedComponent;
};

// Utility function to get auth headers
export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};