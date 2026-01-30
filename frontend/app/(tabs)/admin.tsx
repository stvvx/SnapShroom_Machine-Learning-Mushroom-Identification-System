import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, api } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Analytics {
  total_users: number;
  active_users_30d: number;
  admin_count: number;
  inactive_users: number;
  total_accounts: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  is_active: boolean;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have admin privileges');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAnalytics(), loadUsers()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadAnalytics(), loadUsers()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangeRole = (selectedUser: User) => {
    const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Change User Role',
      `Change ${selectedUser.name} role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.put(`/admin/users/${selectedUser.id}/role`, {
                role: newRole,
              });
              if (response.data.success) {
                Alert.alert('Success', response.data.message);
                await loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
            }
          },
        },
      ]
    );
  };

  const handleDeactivateUser = (selectedUser: User) => {
    Alert.alert(
      'Deactivate User',
      `Deactivate ${selectedUser.name}? They will not be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.put(`/admin/users/${selectedUser.id}/deactivate`);
              if (response.data.success) {
                Alert.alert('Success', response.data.message);
                await loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to deactivate user');
            }
          },
        },
      ]
    );
  };

  const handleActivateUser = (selectedUser: User) => {
    Alert.alert(
      'Activate User',
      `Activate ${selectedUser.name}? They will be able to log in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              const response = await api.put(`/admin/users/${selectedUser.id}/activate`);
              if (response.data.success) {
                Alert.alert('Success', response.data.message);
                await loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to activate user');
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Welcome, {user.name}</ThemedText>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'analytics' && styles.tabActive]}
            onPress={() => setViewMode('analytics')}
          >
            <Ionicons
              name="bar-chart"
              size={20}
              color={viewMode === 'analytics' ? '#fff' : '#6B7C61'}
            />
            <ThemedText
              style={[styles.tabText, viewMode === 'analytics' && styles.tabTextActive]}
            >
              Analytics
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === 'users' && styles.tabActive]}
            onPress={() => setViewMode('users')}
          >
            <Ionicons
              name="people"
              size={20}
              color={viewMode === 'users' ? '#fff' : '#6B7C61'}
            />
            <ThemedText
              style={[styles.tabText, viewMode === 'users' && styles.tabTextActive]}
            >
              Users
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B7C61" />
          </View>
        ) : viewMode === 'analytics' ? (
          <AnalyticsView analytics={analytics} />
        ) : (
          <UsersView
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            onChangeRole={handleChangeRole}
            onDeactivate={handleDeactivateUser}
            onActivate={handleActivateUser}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

// Analytics View Component
function AnalyticsView({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return <ThemedText style={styles.emptyText}>No analytics available</ThemedText>;
  }

  const cards = [
    {
      title: 'Total Users',
      value: analytics.total_users,
      icon: 'people',
      color: '#6B7C61',
    },
    {
      title: 'Active (30d)',
      value: analytics.active_users_30d,
      icon: 'checkmark-circle',
      color: '#4CAF50',
    },
    {
      title: 'Admins',
      value: analytics.admin_count,
      icon: 'shield',
      color: '#FF9800',
    },
    {
      title: 'Inactive',
      value: analytics.inactive_users,
      icon: 'close-circle',
      color: '#F44336',
    },
  ];

  return (
    <View style={styles.analyticsContainer}>
      {cards.map((card, index) => (
        <View key={index} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: card.color + '20' }]}>
            <Ionicons name={card.icon as any} size={28} color={card.color} />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={styles.statValue}>{card.value}</ThemedText>
            <ThemedText style={styles.statLabel}>{card.title}</ThemedText>
          </View>
        </View>
      ))}

      <View style={styles.summaryCard}>
        <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Total Accounts:</ThemedText>
          <ThemedText style={styles.summaryValue}>{analytics.total_accounts}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Active Rate:</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {((analytics.total_users / analytics.total_accounts) * 100).toFixed(1)}%
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// Users View Component
interface UsersViewProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  onChangeRole: (user: User) => void;
  onDeactivate: (user: User) => void;
  onActivate: (user: User) => void;
}

function UsersView({
  users,
  selectedUser,
  onSelectUser,
  onChangeRole,
  onDeactivate,
  onActivate,
}: UsersViewProps) {
  if (users.length === 0) {
    return <ThemedText style={styles.emptyText}>No users found</ThemedText>;
  }

  return (
    <View style={styles.usersContainer}>
      {selectedUser ? (
        <UserDetailView
          user={selectedUser}
          onBack={() => onSelectUser(null)}
          onChangeRole={() => onChangeRole(selectedUser)}
          onDeactivate={() => onDeactivate(selectedUser)}
          onActivate={() => onActivate(selectedUser)}
        />
      ) : (
        <FlatList
          scrollEnabled={false}
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => onSelectUser(item)}
            >
              <View style={styles.userCardContent}>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{item.name}</ThemedText>
                  <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
                </View>
                <View style={styles.userMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: item.role === 'admin' ? '#FF9800' : '#6B7C61',
                      },
                    ]}
                  >
                    <ThemedText style={styles.roleBadgeText}>
                      {item.role.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: item.is_active ? '#4CAF50' : '#F44336',
                      },
                    ]}
                  >
                    <ThemedText style={styles.statusBadgeText}>
                      {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7C61" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// User Detail View Component
interface UserDetailViewProps {
  user: User;
  onBack: () => void;
  onChangeRole: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}

function UserDetailView({
  user,
  onBack,
  onChangeRole,
  onDeactivate,
  onActivate,
}: UserDetailViewProps) {
  return (
    <View style={styles.detailContainer}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color="#6B7C61" />
        <ThemedText style={styles.backButtonText}>Back</ThemedText>
      </TouchableOpacity>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.detailAvatar}>
            <Ionicons name="person-circle" size={60} color="#6B7C61" />
          </View>
          <View style={styles.detailHeaderContent}>
            <ThemedText style={styles.detailName}>{user.name}</ThemedText>
            <ThemedText style={styles.detailEmail}>{user.email}</ThemedText>
          </View>
        </View>

        <View style={styles.detailInfo}>
          <DetailRow label="Username" value={user.username} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Role" value={user.role.toUpperCase()} />
          <DetailRow label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
          <DetailRow
            label="Joined"
            value={new Date(user.created_at).toLocaleDateString()}
          />
        </View>

        <View style={styles.detailActions}>
          <TouchableOpacity style={[styles.actionButton, styles.changeRoleButton]} onPress={onChangeRole}>
            <Ionicons name="swap-vertical" size={18} color="#fff" />
            <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
              Change Role
            </ThemedText>
          </TouchableOpacity>

          {user.is_active ? (
            <TouchableOpacity style={[styles.actionButton, styles.deactivateButton]} onPress={onDeactivate}>
              <Ionicons name="block" size={18} color="#fff" />
              <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
                Deactivate
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionButton, styles.activateButton]} onPress={onActivate}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
                Activate
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// Detail Row Component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2D3E2D',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A8B89D',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#E8E4DE',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#6B7C61',
    borderColor: '#6B7C61',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7C61',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3E2D',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2D',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DE',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40,
  },
  usersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E4DE',
  },
  userCardContent: {
    flex: 1,
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  detailContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7C61',
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 20,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailAvatar: {
    marginBottom: 12,
  },
  detailHeaderContent: {
    alignItems: 'center',
  },
  detailName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 4,
  },
  detailEmail: {
    fontSize: 12,
    color: '#999',
  },
  detailInfo: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E4DE',
    paddingVertical: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  detailActions: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  changeRoleButton: {
    backgroundColor: '#6B7C61',
  },
  deactivateButton: {
    backgroundColor: '#F44336',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
