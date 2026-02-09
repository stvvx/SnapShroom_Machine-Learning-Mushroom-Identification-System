import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, api } from '@/contexts/AuthContext';
import HamburgerMenu from '@/components/HamburgerMenu';

const { width } = Dimensions.get('window');

interface MushroomAnalytics {
  total_scans: number;
  scans_last_30d: number;
  most_scanned_mushrooms: { name: string; count: number }[];
  top_locations: { location: string; count: number }[];
  detection_success_rate: number;
  edible_vs_toxic: { edible: number; toxic: number; unknown: number };
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  recent_registrations_30d: number;
  recent_logins_7d: number;
}

interface Analytics {
  users: UserAnalytics;
  mushrooms: MushroomAnalytics;
  timeline: { date: string; scans: number }[];
}

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  is_active: boolean;
  last_login?: string;
}

type ViewMode = 'analytics' | 'users';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('analytics');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // 🔒 HARD GUARD
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access only');
      router.replace('/(tabs)');
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadAnalytics(), loadUsers()]);
      setLoading(false);
    };
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAnalytics(), loadUsers()]);
    setRefreshing(false);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus
        ? `/admin/users/${userId}/deactivate`
        : `/admin/users/${userId}/activate`;
      
      const res = await api.put(endpoint);
      
      if (res.data.success) {
        Alert.alert('Success', res.data.message);
        await loadUsers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    Alert.alert(
      'Confirm Role Change',
      `Change role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
              if (res.data.success) {
                Alert.alert('Success', res.data.message);
                await loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to change role');
            }
          },
        },
      ]
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Access Denied</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <HamburgerMenu />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>🔐 Admin Dashboard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Welcome, {user.name}
          </ThemedText>
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          {[
            { mode: 'analytics', icon: 'bar-chart', label: 'Analytics' },
            { mode: 'users', icon: 'people', label: 'Users' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.mode}
              style={[
                styles.tab,
                viewMode === tab.mode && styles.tabActive,
              ]}
              onPress={() => setViewMode(tab.mode as ViewMode)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={viewMode === tab.mode ? '#fff' : '#6B7C61'}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  viewMode === tab.mode && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B7C61" />
            <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
          </View>
        ) : viewMode === 'analytics' ? (
          <View style={styles.analyticsContainer}>
            {/* Render analytics content... */}
            {analytics && (
              <>
                {/* USER STATS */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>👥 User Analytics</ThemedText>
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
                      <Ionicons name="people" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.users.total_users}</ThemedText>
                      <ThemedText style={styles.statLabel}>Total Users</ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#44A08D' }]}>
                      <Ionicons name="checkmark-circle" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.users.active_users}</ThemedText>
                      <ThemedText style={styles.statLabel}>Active</ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E84A5F' }]}>
                      <Ionicons name="close-circle" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.users.inactive_users}</ThemedText>
                      <ThemedText style={styles.statLabel}>Inactive</ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#6B7C61' }]}>
                      <Ionicons name="shield-checkmark" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.users.admin_count}</ThemedText>
                      <ThemedText style={styles.statLabel}>Admins</ThemedText>
                    </View>
                  </View>
                </View>

                {/* MUSHROOM STATS */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>🍄 Mushroom Analytics</ThemedText>
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#FF6B6B' }]}>
                      <Ionicons name="scan" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.mushrooms.total_scans}</ThemedText>
                      <ThemedText style={styles.statLabel}>Total Scans</ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
                      <Ionicons name="calendar" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.mushrooms.scans_last_30d}</ThemedText>
                      <ThemedText style={styles.statLabel}>Last 30 Days</ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#95E1D3' }]}>
                      <Ionicons name="checkmark-done" size={28} color="#fff" />
                      <ThemedText style={styles.statNumber}>{analytics.mushrooms.detection_success_rate}%</ThemedText>
                      <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
                    </View>
                  </View>

                  {/* EDIBILITY DISTRIBUTION */}
                  <View style={styles.edibilityContainer}>
                    <ThemedText style={styles.subSectionTitle}>Edibility Distribution</ThemedText>
                    <View style={styles.edibilityStats}>
                      <View style={styles.edibilityStat}>
                        <Ionicons name="checkmark-circle" size={24} color="#44A08D" />
                        <ThemedText style={styles.edibilityNumber}>{analytics.mushrooms.edible_vs_toxic.edible}</ThemedText>
                        <ThemedText style={styles.edibilityLabel}>Edible</ThemedText>
                      </View>
                      <View style={styles.edibilityStat}>
                        <Ionicons name="warning" size={24} color="#E84A5F" />
                        <ThemedText style={styles.edibilityNumber}>{analytics.mushrooms.edible_vs_toxic.toxic}</ThemedText>
                        <ThemedText style={styles.edibilityLabel}>Toxic</ThemedText>
                      </View>
                      <View style={styles.edibilityStat}>
                        <Ionicons name="help-circle" size={24} color="#FF9F1C" />
                        <ThemedText style={styles.edibilityNumber}>{analytics.mushrooms.edible_vs_toxic.unknown}</ThemedText>
                        <ThemedText style={styles.edibilityLabel}>Unknown</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* MOST SCANNED MUSHROOMS */}
                {analytics.mushrooms.most_scanned_mushrooms.length > 0 && (
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>🏆 Most Scanned Mushrooms</ThemedText>
                    {analytics.mushrooms.most_scanned_mushrooms.slice(0, 5).map((item, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.rankBadge}>
                          <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
                        </View>
                        <ThemedText style={styles.listItemText}>{item.name}</ThemedText>
                        <ThemedText style={styles.listItemCount}>{item.count} scans</ThemedText>
                      </View>
                    ))}
                  </View>
                )}

                {/* TOP LOCATIONS */}
                {analytics.mushrooms.top_locations.length > 0 && (
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>📍 Top Scan Locations</ThemedText>
                    {analytics.mushrooms.top_locations.slice(0, 5).map((item, index) => (
                      <View key={index} style={styles.listItem}>
                        <Ionicons name="location" size={20} color="#6B7C61" />
                        <ThemedText style={styles.listItemText}>{item.location}</ThemedText>
                        <ThemedText style={styles.listItemCount}>{item.count} scans</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          /* USER MANAGEMENT */
          <View style={styles.usersContainer}>
            <ThemedText style={styles.sectionTitle}>
              👥 User Management ({users.length} users)
            </ThemedText>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <ThemedText style={styles.userName}>{item.name}</ThemedText>
                      <View style={[
                        styles.roleBadge,
                        { backgroundColor: item.role === 'admin' ? '#6B7C61' : '#4ECDC4' }
                      ]}>
                        <ThemedText style={styles.roleBadgeText}>
                          {item.role.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
                    <ThemedText style={styles.userUsername}>@{item.username}</ThemedText>
                    <ThemedText style={styles.userDate}>
                      Joined: {new Date(item.created_at).toLocaleDateString()}
                    </ThemedText>
                    {item.last_login && (
                      <ThemedText style={styles.userDate}>
                        Last login: {new Date(item.last_login).toLocaleDateString()}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.userActions}>
                    {/* Toggle Status */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: item.is_active ? '#E84A5F' : '#44A08D' }
                      ]}
                      onPress={() => handleToggleUserStatus(item.id, item.is_active)}
                    >
                      <Ionicons
                        name={item.is_active ? 'close-circle' : 'checkmark-circle'}
                        size={18}
                        color="#fff"
                      />
                      <ThemedText style={styles.actionButtonText}>
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </ThemedText>
                    </TouchableOpacity>

                    {/* Change Role */}
                    {item.id !== user.id && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#6B7C61' }]}
                        onPress={() => handleChangeRole(item.id, item.role)}
                      >
                        <Ionicons name="shield" size={18} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>
                          Make {item.role === 'admin' ? 'User' : 'Admin'}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFA' },
  header: {
    padding: 20,
    backgroundColor: '#2D3E2D',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#A8B89D',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#F5F3EF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: '#6B7C61',
  },
  tabText: {
    color: '#6B7C61',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7C61',
  },
  analyticsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2D3E2D',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2D3E2D',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  edibilityContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
  },
  edibilityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  edibilityStat: {
    alignItems: 'center',
    gap: 4,
  },
  edibilityNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3E2D',
  },
  edibilityLabel: {
    fontSize: 11,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7C61',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  listItemCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  usersContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3E2D',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
