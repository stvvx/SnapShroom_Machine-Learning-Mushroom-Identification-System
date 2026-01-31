import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const { user, isLoading } = useAuth();

  // 🛑 Prevent tab flicker while auth is loading
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#2D3E2D',
        }}
      >
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: '#A8B89D',
        tabBarStyle: { backgroundColor: '#2D3E2D' },
      }}
    >
      {/* USER HOME - Show only for non-admin users */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 24} color={color} />
          ),
          href: isAdmin ? false : undefined, // Hide from admin, show for non-admin
        }}
      />

      {/* ADMIN HOME - Show only for admin users */}
      <Tabs.Screen
        name="indexAdmin"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 24} color={color} />
          ),
          href: isAdmin ? undefined : false, // Show for admin, hide from non-admin
        }}
      />
      
      {/* CAMERA TAB - Available to all users */}
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size ?? 24} color={color} />
          ),
        }}
      />

      {/* PROFILE - Available to all users */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size ?? 24} color={color} />
          ),
        }}
      />

      {/* HIDDEN ROUTE */}
      <Tabs.Screen
        name="explore"
        options={{ href: false }}
      />
    </Tabs>
  );
}