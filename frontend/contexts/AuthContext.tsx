// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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
export interface SignupData extends LoginCredentials {
  name: string;
  confirmPassword: string;
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
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'snapshroom_user_token',
  USER_DATA: 'snapshroom_user_data',
  SESSION_EXPIRY: 'snapshroom_session_expiry',
};

// Secure storage (for sensitive data)
const SECURE_STORAGE_KEYS = {
  REFRESH_TOKEN: 'snapshroom_refresh_token',
};

// Mock API functions (replace with your actual API calls)
const mockApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (credentials.email === 'demo@snapshroom.com' && credentials.password === 'password123') {
      return {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          subscription: { type: 'free' },
          preferences: { notifications: true, emailUpdates: true },
        },
        token: 'mock_jwt_token',
        refreshToken: 'mock_refresh_token',
      };
    }
    throw new Error('Invalid email or password');
  },

  signup: async (data: SignupData): Promise<{ user: User; token: string; refreshToken: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    return {
      user: {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        subscription: { type: 'free' },
        preferences: { notifications: true, emailUpdates: true },
      },
      token: 'mock_jwt_token_new',
      refreshToken: 'mock_refresh_token_new',
    };
  },

  forgotPassword: async (email: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email.includes('@')) {
      throw new Error('Invalid email address');
    }
    
    // Mock: Would send password reset email here
    return;
  },

  validateToken: async (token: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock token validation
    if (token && token.startsWith('mock_jwt_token')) {
      return {
        id: '1',
        email: 'demo@snapshroom.com',
        name: 'Demo User',
        subscription: { type: 'free' },
        preferences: { notifications: true, emailUpdates: true },
      };
    }
    throw new Error('Invalid token');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (refreshToken && refreshToken.startsWith('mock_refresh_token')) {
      return {
        token: 'mock_jwt_token_refreshed',
        refreshToken: 'mock_refresh_token_new',
      };
    }
    throw new Error('Invalid refresh token');
  },
};

// Storage helper functions
const storage = {
  // Store data securely based on platform
  setSecureItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getSecureItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  removeSecureItem: async (key: string) => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        // Validate token with backend (optional)
        try {
          const validUser = await mockApi.validateToken(token);
          setUser(validUser);
        } catch (validationError) {
          // Token is invalid, clear storage
          await clearAuthData();
        }
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
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.SESSION_EXPIRY,
      ]);
      
      await storage.removeSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
      
      setUser(null);
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  };

  // Store auth data
  const storeAuthData = async (token: string, refreshToken: string, userData: User) => {
    try {
      // Store token and user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      // Store refresh token securely
      await storage.setSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      // Set session expiry (24 hours from now)
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiry.toISOString());
      
      setUser(userData);
      setError(null);
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
      const response = await mockApi.login(credentials);
      await storeAuthData(response.token, response.refreshToken, response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (data: SignupData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mockApi.signup(data);
      await storeAuthData(response.token, response.refreshToken, response.user);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Optional: Call backend logout endpoint
      // await api.logout();
      
      // Clear local storage
      await clearAuthData();
      setError(null);
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
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      // Optional: Call backend update endpoint
      // await api.updateUserProfile(updates);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await mockApi.forgotPassword(email);
      Alert.alert(
        'Password Reset',
        'If an account exists with this email, you will receive password reset instructions.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh token (for automatic session renewal)
  const refreshAuthToken = async () => {
    try {
      const refreshToken = await storage.getSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
      
      if (refreshToken) {
        const response = await mockApi.refreshToken(refreshToken);
        const userData = user ? user : JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
        
        await storeAuthData(response.token, response.refreshToken, userData);
        return true;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    return false;
  };

  // Check session expiry
  const checkSessionExpiry = async () => {
    try {
      const expiryString = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
      
      if (expiryString) {
        const expiry = new Date(expiryString);
        const now = new Date();
        
        // If session expired, try to refresh
        if (expiry < now) {
          const refreshed = await refreshAuthToken();
          
          if (!refreshed) {
            // Refresh failed, logout user
            await clearAuthData();
          }
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  // Effects
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check session every 5 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateUser,
    forgotPassword,
    clearError,
    error,
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