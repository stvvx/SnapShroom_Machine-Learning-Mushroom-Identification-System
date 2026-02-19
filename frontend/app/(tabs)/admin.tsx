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
import {
  LineChart,
  BarChart,
  ProgressChart,
} from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, api } from '@/contexts/AuthContext';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';
import {
  buildAnalyticsReport,
  buildUsersReport,
  buildOverviewReport,
} from '@/components/pdf-reports';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#F5F3EF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74, 94, 58, ${opacity})`,
  labelColor: () => '#4A5E3A',
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#6B7C61', fill: '#fff' },
  propsForBackgroundLines: {
    strokeDasharray: '4 4', stroke: '#C5D4BC', strokeWidth: 1,
  },
};

const safeBarData = (items: { label: string; value: number }[], max = 5) => {
  const filtered = items.filter(i => typeof i.value === 'number').slice(0, max);
  if (filtered.length === 0) return { labels: ['No data'], datasets: [{ data: [0] }] };
  return {
    labels: filtered.map(i => (i.label.length > 8 ? i.label.slice(0, 8) + '…' : i.label)),
    datasets: [{ data: filtered.map(i => i.value) }],
  };
};

/* ─── Types ─── */
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
type Section = 'home' | 'users' | 'analytics' | 'about';

/* ─── PDF export helper with proper formatting ─── */
const exportPDF = async (html: string, filename: string) => {
  try {
    Alert.alert('Generating PDF', 'Please wait...');
    
    // Generate PDF with A4 dimensions and proper formatting
    const { uri } = await Print.printToFileAsync({ 
      html, 
      base64: false,
      width: 595, // A4 width in points (210mm)
      height: 842, // A4 height in points (297mm)
      orientation: 'portrait',
    });
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('PDF file was not created');
    }
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Save ${filename}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Saved', `Report saved to:\n${uri}`);
    }
  } catch (err: any) {
    Alert.alert('Export Failed', err?.message || 'Could not generate PDF.');
  }
};

/* ─── Individual Export Button for each section ─── */
const SectionExportButton = ({
  onPress,
  label,
  icon = 'document-text-outline',
  size = 'small',
}: {
  onPress: () => void;
  label: string;
  icon?: string;
  size?: 'small' | 'medium';
}) => (
  <TouchableOpacity 
    style={[s.sectionExportBtn, size === 'small' ? s.sectionExportBtnSmall : s.sectionExportBtnMedium]} 
    onPress={onPress} 
    activeOpacity={0.8}
  >
    <Ionicons name={icon as any} size={size === 'small' ? 14 : 16} color="#fff" />
    <ThemedText style={[s.sectionExportBtnText, size === 'small' ? s.sectionExportBtnTextSmall : s.sectionExportBtnTextMedium]}>
      {label}
    </ThemedText>
  </TouchableOpacity>
);

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [analytics, setAnalytics]           = useState<Analytics | null>(null);
  const [users, setUsers]                   = useState<User[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access only');
      router.replace('/(tabs)');
    }
  }, [user]);

  const setAuthHeader = () => {
    if (accessToken && !api.defaults.headers.common.Authorization) {
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    }
  };

  const loadAnalytics = async () => {
    try {
      setAuthHeader();
      const res = await api.get('/admin/analytics');
      if (res.data.success) setAnalytics(res.data.analytics);
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'Login', onPress: () => router.replace('/') },
        ]);
      }
    }
  };

  const loadUsers = async () => {
    try {
      setAuthHeader();
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'Login', onPress: () => router.replace('/') },
        ]);
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (currentSection === 'home')       await loadAnalytics();
      else if (currentSection === 'users') await loadUsers();
      setLoading(false);
    };
    if (user && user.role === 'admin' && accessToken) load();
  }, [currentSection, user, accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (['home', 'analytics'].includes(currentSection)) await loadAnalytics();
    else if (currentSection === 'users') await loadUsers();
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
    Alert.alert('Confirm Role Change', `Change role to ${newRole}?`, [
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
    ]);
  };

  if (!user || user.role !== 'admin') {
    return (
      <ThemedView style={s.container}>
        <ThemedText>Access Denied</ThemedText>
      </ThemedView>
    );
  }

  /* ════════════════════════════════════════════
     HOME SECTION
  ════════════════════════════════════════════ */
  const renderHome = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7C61" />
          <ThemedText style={s.loadingText}>Loading dashboard...</ThemedText>
        </View>
      ) : analytics ? (
        <>
          {/* Main Overview Export */}
          <View style={s.mainExportContainer}>
            <TouchableOpacity
              style={s.mainExportBtn}
              onPress={() =>
                exportPDF(
                  buildOverviewReport(analytics, user.name),
                  'SnapShroom_Overview_Report.pdf',
                )
              }
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <ThemedText style={s.mainExportBtnText}>Export Complete Overview Report (PDF)</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>⚡ Quick Actions</ThemedText>
            </View>
            <View style={s.quickActionsGrid}>
              <TouchableOpacity
                style={[s.quickActionCard, { backgroundColor: '#4ECDC4' }]}
                onPress={() => setCurrentSection('users')}
              >
                <Ionicons name="people" size={32} color="#fff" />
                <ThemedText style={s.quickActionText}>Manage Users</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quickActionCard, { backgroundColor: '#FF6B6B' }]}
                onPress={() => setCurrentSection('analytics')}
              >
                <Ionicons name="bar-chart" size={32} color="#fff" />
                <ThemedText style={s.quickActionText}>View Analytics</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quickActionCard, { backgroundColor: '#6B7C61' }]}
                onPress={() => loadAnalytics()}
              >
                <Ionicons name="refresh" size={32} color="#fff" />
                <ThemedText style={s.quickActionText}>Refresh Data</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary Stats */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>📊 Overview Statistics</ThemedText>
            </View>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { backgroundColor: '#4ECDC4' }]}>
                <Ionicons name="people" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.total_users}</ThemedText>
                <ThemedText style={s.statLabel}>Total Users</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#44A08D' }]}>
                <Ionicons name="checkmark-circle" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.active_users}</ThemedText>
                <ThemedText style={s.statLabel}>Active Users</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="scan" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.mushrooms.total_scans}</ThemedText>
                <ThemedText style={s.statLabel}>Total Scans</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#95E1D3' }]}>
                <Ionicons name="calendar" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.mushrooms.scans_last_30d}</ThemedText>
                <ThemedText style={s.statLabel}>Scans (30d)</ThemedText>
              </View>
            </View>
          </View>

          {/* Scan Timeline */}
          {analytics.timeline && analytics.timeline.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <ThemedText style={s.sectionTitle}>📈 Scan Timeline</ThemedText>
              </View>
              <ThemedText style={s.chartSubtitle}>Daily scan activity</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels:   analytics.timeline.map(t => t.date),
                    datasets: [{ data: analytics.timeline.map(t => t.scans), color: () => '#4ECDC4' }],
                  }}
                  width={Math.max(CHART_WIDTH, analytics.timeline.length * 52)}
                  height={200}
                  chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(78,205,196,${o})` }}
                  bezier
                  withShadow={false}
                  style={s.chart}
                />
              </ScrollView>
            </View>
          )}

          {/* User Status Rings */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>👤 User Status Breakdown</ThemedText>
            </View>
            <ThemedText style={s.chartSubtitle}>Active · Inactive · Admins (as % of total)</ThemedText>
            <ProgressChart
              data={{
                labels: ['Active', 'Inactive', 'Admins'],
                data: [
                  analytics.users.total_users > 0 ? analytics.users.active_users   / analytics.users.total_users : 0,
                  analytics.users.total_users > 0 ? analytics.users.inactive_users / analytics.users.total_users : 0,
                  analytics.users.total_users > 0 ? analytics.users.admin_count    / analytics.users.total_users : 0,
                ],
              }}
              width={CHART_WIDTH}
              height={180}
              strokeWidth={14}
              radius={36}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index?: number) => {
                  const colors = [
                    `rgba(78,205,196,${opacity})`,
                    `rgba(232,74,95,${opacity})`,
                    `rgba(107,124,97,${opacity})`,
                  ];
                  return colors[index ?? 0] ?? colors[0];
                },
              }}
              style={s.chart}
              hideLegend={false}
            />
          </View>

          {/* Quick Info */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>ℹ️ Quick Info</ThemedText>
            </View>
            <View style={s.infoGrid}>
              <View style={s.infoItem}>
                <Ionicons name="shield-checkmark" size={24} color="#6B7C61" />
                <ThemedText style={s.infoLabel}>Admin Count</ThemedText>
                <ThemedText style={s.infoValue}>{analytics.users.admin_count}</ThemedText>
              </View>
              <View style={s.infoItem}>
                <Ionicons name="checkmark-done" size={24} color="#95E1D3" />
                <ThemedText style={s.infoLabel}>Success Rate</ThemedText>
                <ThemedText style={s.infoValue}>{analytics.mushrooms.detection_success_rate}%</ThemedText>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={s.emptyContainer}>
          <Ionicons name="analytics" size={64} color="#ccc" />
          <ThemedText style={s.emptyText}>No analytics data available</ThemedText>
        </View>
      )}
    </View>
  );

  /* ════════════════════════════════════════════
     USERS SECTION
  ════════════════════════════════════════════ */
  const renderUsers = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7C61" />
          <ThemedText style={s.loadingText}>Loading users...</ThemedText>
        </View>
      ) : (
        <View style={s.usersContainer}>
          {/* Main User Directory Export */}
          {users.length > 0 && (
            <View style={s.mainExportContainer}>
              <TouchableOpacity
                style={s.mainExportBtn}
                onPress={() =>
                  exportPDF(
                    buildUsersReport(users, user.name),
                    'SnapShroom_User_Directory.pdf',
                  )
                }
              >
                <Ionicons name="people" size={20} color="#fff" />
                <ThemedText style={s.mainExportBtnText}>Export Complete User Directory (PDF)</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>
                👥 User Management ({users.length} users)
              </ThemedText>
            </View>
          </View>

          <FlatList
            data={users}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={s.userCard}>
                <View style={s.userInfo}>
                  <View style={s.userHeader}>
                    <ThemedText style={s.userName}>{item.name}</ThemedText>
                    <View style={[s.roleBadge, { backgroundColor: item.role === 'admin' ? '#6B7C61' : '#4ECDC4' }]}>
                      <ThemedText style={s.roleBadgeText}>{item.role.toUpperCase()}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={s.userEmail}>{item.email}</ThemedText>
                  <ThemedText style={s.userUsername}>@{item.username}</ThemedText>
                  <ThemedText style={s.userDate}>
                    Joined: {new Date(item.created_at).toLocaleDateString()}
                  </ThemedText>
                  {item.last_login && (
                    <ThemedText style={s.userDate}>
                      Last login: {new Date(item.last_login).toLocaleDateString()}
                    </ThemedText>
                  )}
                </View>
                <View style={s.userActions}>
                  <TouchableOpacity
                    style={[s.actionButton, { backgroundColor: item.is_active ? '#E84A5F' : '#44A08D' }]}
                    onPress={() => handleToggleUserStatus(item.id, item.is_active)}
                  >
                    <Ionicons name={item.is_active ? 'close-circle' : 'checkmark-circle'} size={18} color="#fff" />
                    <ThemedText style={s.actionButtonText}>
                      {item.is_active ? 'Deactivate' : 'Activate'}
                    </ThemedText>
                  </TouchableOpacity>
                  {item.id !== user.id && (
                    <TouchableOpacity
                      style={[s.actionButton, { backgroundColor: '#6B7C61' }]}
                      onPress={() => handleChangeRole(item.id, item.role)}
                    >
                      <Ionicons name="shield" size={18} color="#fff" />
                      <ThemedText style={s.actionButtonText}>
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
    </View>
  );

  /* ════════════════════════════════════════════
     ANALYTICS SECTION
  ════════════════════════════════════════════ */
  const renderAnalytics = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7C61" />
          <ThemedText style={s.loadingText}>Loading analytics...</ThemedText>
        </View>
      ) : analytics ? (
        <>
          {/* Main Analytics Export */}
          <View style={s.mainExportContainer}>
            <TouchableOpacity
              style={s.mainExportBtn}
              onPress={() =>
                exportPDF(
                  buildAnalyticsReport(analytics, user.name),
                  'SnapShroom_Full_Analytics.pdf',
                )
              }
            >
              <Ionicons name="bar-chart" size={20} color="#fff" />
              <ThemedText style={s.mainExportBtnText}>Export Full Analytics Report (PDF)</ThemedText>
            </TouchableOpacity>
          </View>

          {/* User Stats */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>👥 User Analytics</ThemedText>
            </View>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { backgroundColor: '#4ECDC4' }]}>
                <Ionicons name="people" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.total_users}</ThemedText>
                <ThemedText style={s.statLabel}>Total Users</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#44A08D' }]}>
                <Ionicons name="checkmark-circle" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.active_users}</ThemedText>
                <ThemedText style={s.statLabel}>Active</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#E84A5F' }]}>
                <Ionicons name="close-circle" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.inactive_users}</ThemedText>
                <ThemedText style={s.statLabel}>Inactive</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#6B7C61' }]}>
                <Ionicons name="shield-checkmark" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.users.admin_count}</ThemedText>
                <ThemedText style={s.statLabel}>Admins</ThemedText>
              </View>
            </View>
            <ThemedText style={[s.subSectionTitle, { marginTop: 16 }]}>User Composition</ThemedText>
            <ThemedText style={s.chartSubtitle}>Active vs Inactive vs Admins</ThemedText>
            <BarChart
              data={{
                labels: ['Active', 'Inactive', 'Admins'],
                datasets: [{
                  data: [
                    analytics.users.active_users,
                    analytics.users.inactive_users,
                    analytics.users.admin_count,
                  ],
                  colors: [() => '#4ECDC4', () => '#E84A5F', () => '#6B7C61'],
                }],
              }}
              width={CHART_WIDTH}
              height={200}
              fromZero
              showValuesOnTopOfBars
              withCustomBarColorFromData
              flatColor
              chartConfig={{ ...chartConfig, barPercentage: 0.6 }}
              style={s.chart}
            />
          </View>

          {/* Mushroom Stats */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>🍄 Mushroom Analytics</ThemedText>
            </View>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="scan" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.mushrooms.total_scans}</ThemedText>
                <ThemedText style={s.statLabel}>Total Scans</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#4ECDC4' }]}>
                <Ionicons name="calendar" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.mushrooms.scans_last_30d}</ThemedText>
                <ThemedText style={s.statLabel}>Last 30 Days</ThemedText>
              </View>
              <View style={[s.statCard, { backgroundColor: '#95E1D3' }]}>
                <Ionicons name="checkmark-done" size={28} color="#fff" />
                <ThemedText style={s.statNumber}>{analytics.mushrooms.detection_success_rate}%</ThemedText>
                <ThemedText style={s.statLabel}>Success Rate</ThemedText>
              </View>
            </View>
          </View>

          {/* Scan Timeline */}
          {analytics.timeline && analytics.timeline.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <ThemedText style={s.sectionTitle}>📈 Scan Timeline</ThemedText>
              </View>
              <ThemedText style={s.chartSubtitle}>Daily scan activity over time</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels:   analytics.timeline.map(t => t.date),
                    datasets: [{ data: analytics.timeline.map(t => t.scans) }],
                  }}
                  width={Math.max(CHART_WIDTH, analytics.timeline.length * 52)}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  withShadow={false}
                  style={s.chart}
                />
              </ScrollView>
            </View>
          )}

          {/* Most Scanned */}
          {analytics.mushrooms.most_scanned_mushrooms.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <ThemedText style={s.sectionTitle}>🏆 Most Scanned Mushrooms</ThemedText>
              </View>
              {analytics.mushrooms.most_scanned_mushrooms.slice(0, 5).map((item, index) => (
                <View key={index} style={s.listItem}>
                  <View style={s.rankBadge}>
                    <ThemedText style={s.rankText}>#{index + 1}</ThemedText>
                  </View>
                  <ThemedText style={s.listItemText}>{item.name}</ThemedText>
                  <ThemedText style={s.listItemCount}>{item.count} scans</ThemedText>
                </View>
              ))}
              <ThemedText style={[s.subSectionTitle, { marginTop: 16 }]}>Scan Count Chart</ThemedText>
              <BarChart
                data={safeBarData(analytics.mushrooms.most_scanned_mushrooms.map(m => ({ label: m.name, value: m.count })))}
                width={CHART_WIDTH}
                height={240}
                fromZero
                showValuesOnTopOfBars
                chartConfig={{ ...chartConfig, barPercentage: 0.55, color: (o = 1) => `rgba(107,124,97,${o})` }}
                style={s.chart}
              />
            </View>
          )}

          {/* Top Locations */}
          {analytics.mushrooms.top_locations.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <ThemedText style={s.sectionTitle}>📍 Top Scan Locations</ThemedText>
              </View>
              {analytics.mushrooms.top_locations.slice(0, 5).map((item, index) => (
                <View key={index} style={s.listItem}>
                  <Ionicons name="location" size={20} color="#6B7C61" />
                  <ThemedText style={s.listItemText}>{item.location}</ThemedText>
                  <ThemedText style={s.listItemCount}>{item.count} scans</ThemedText>
                </View>
              ))}
              <ThemedText style={[s.subSectionTitle, { marginTop: 16 }]}>Location Chart</ThemedText>
              <BarChart
                data={safeBarData(analytics.mushrooms.top_locations.map(l => ({ label: l.location, value: l.count })))}
                width={CHART_WIDTH}
                height={240}
                fromZero
                showValuesOnTopOfBars
                chartConfig={{ ...chartConfig, barPercentage: 0.55, color: (o = 1) => `rgba(78,205,196,${o})` }}
                style={s.chart}
              />
            </View>
          )}
        </>
      ) : (
        <View style={s.emptyContainer}>
          <Ionicons name="bar-chart" size={64} color="#ccc" />
          <ThemedText style={s.emptyText}>No analytics data available</ThemedText>
        </View>
      )}
    </View>
  );

  /* ════════════════════════════════════════════
     ABOUT SECTION
  ════════════════════════════════════════════ */
  const renderAbout = () => (
    <View style={s.contentContainer}>
      <View style={s.section}>
        <View style={s.aboutHeader}>
          <Ionicons name="leaf" size={64} color="#6B7C61" />
          <ThemedText style={s.aboutTitle}>SnapShroom Admin</ThemedText>
          <ThemedText style={s.aboutVersion}>Version 1.0.0</ThemedText>
        </View>
        
        <View style={s.aboutSection}>
          <View style={s.sectionHeader}>
            <ThemedText style={s.aboutSectionTitle}>About This System</ThemedText>
          </View>
          <ThemedText style={s.aboutText}>
            SnapShroom is an advanced mushroom identification system that uses machine learning
            to help users identify mushroom species, assess edibility, and learn about different
            mushroom characteristics.
          </ThemedText>
        </View>
        
        <View style={s.aboutSection}>
          <ThemedText style={s.aboutSectionTitle}>Admin Features</ThemedText>
          <View style={s.featureList}>
            {[
              'User management and role control',
              'Analytics and insights dashboard',
              'System monitoring and statistics',
              'Account activation controls',
              'Formal PDF report export (all sections)',
            ].map((f, i) => (
              <View key={i} style={s.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#44A08D" />
                <ThemedText style={s.featureText}>{f}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        
        <View style={s.aboutSection}>
          <ThemedText style={s.aboutSectionTitle}>Contact & Support</ThemedText>
          <ThemedText style={s.aboutText}>
            For technical support or questions about the admin panel, please contact the development team.
          </ThemedText>
        </View>
      </View>
    </View>
  );

  /* ════════════════════════════════════════════
     ROOT RENDER
  ════════════════════════════════════════════ */
  return (
    <ThemedView style={s.container}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerMenu
            onAdminNavigate={(section) => setCurrentSection(section as Section)}
            currentSection={currentSection}
          />
          <NotificationDropdown iconColor="#A8B89D" />
        </View>
        <View style={s.headerContent}>
          <ThemedText style={s.headerTitle}>
            {currentSection === 'home'      && '🏠 Admin Dashboard'}
            {currentSection === 'users'     && '👥 User Management'}
            {currentSection === 'analytics' && '📊 Analytics'}
            {currentSection === 'about'     && 'ℹ️ About'}
          </ThemedText>
          <ThemedText style={s.headerSubtitle}>Welcome, {user.name}</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {currentSection === 'home'      && renderHome()}
        {currentSection === 'users'     && renderUsers()}
        {currentSection === 'analytics' && renderAnalytics()}
        {currentSection === 'about'     && renderAbout()}
      </ScrollView>
    </ThemedView>
  );
}

/* ════════════════════════════════════════════
   STYLES (Keep your existing styles)
════════════════════════════════════════════ */
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FDFCFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2D3E2D',
    paddingTop: 50,
    gap: 12,
  },
  headerContent:   { flex: 1 },
  headerTitle:     { fontSize: 22, color: '#fff', fontWeight: '700', marginBottom: 4 },
  headerSubtitle:  { color: '#A8B89D', fontSize: 13 },
  contentContainer:{ padding: 16 },
  loadingContainer:{ padding: 40, alignItems: 'center' },
  loadingText:     { marginTop: 12, color: '#6B7C61' },
  emptyContainer:  { padding: 40, alignItems: 'center' },
  emptyText:       { marginTop: 12, color: '#999', fontSize: 16 },
  
  mainExportContainer: { marginBottom: 16 },
  mainExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3020',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mainExportBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A5E3A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  sectionExportBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionExportBtnMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionExportBtnText: { color: '#fff', fontWeight: '600' },
  sectionExportBtnTextSmall: { fontSize: 11 },
  sectionExportBtnTextMedium: { fontSize: 12 },
  
  quickActionsGrid:{ flexDirection: 'row', gap: 12 },
  quickActionCard: {
    flex: 1, padding: 20, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  quickActionText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
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
  sectionTitle:    { fontSize: 20, fontWeight: '700', color: '#2D3E2D' },
  subSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#2D3E2D' },
  chartSubtitle:   { fontSize: 12, color: '#888', marginBottom: 12 },
  chart:           { borderRadius: 10, alignSelf: 'center' },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  statNumber:      { fontSize: 28, fontWeight: '700', color: '#fff' },
  statLabel:       { fontSize: 12, color: '#fff', textAlign: 'center', opacity: 0.9 },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: '#F5F3EF',
    borderRadius: 8, marginBottom: 8, gap: 12,
  },
  rankBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#6B7C61',
    alignItems: 'center', justifyContent: 'center',
  },
  rankText:        { color: '#fff', fontWeight: '700', fontSize: 12 },
  listItemText:    { flex: 1, fontSize: 14, fontWeight: '600', color: '#2D3E2D' },
  listItemCount:   { fontSize: 13, color: '#666', fontWeight: '600' },
  usersContainer:  { flex: 1 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  userInfo:        { marginBottom: 12 },
  userHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userName:        { fontSize: 18, fontWeight: '700', color: '#2D3E2D' },
  roleBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  userEmail:       { fontSize: 14, color: '#666', marginBottom: 2 },
  userUsername:    { fontSize: 13, color: '#888', marginBottom: 4 },
  userDate:        { fontSize: 12, color: '#999', marginTop: 2 },
  userActions:     { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 10, borderRadius: 8, gap: 6,
  },
  actionButtonText:{ color: '#fff', fontSize: 13, fontWeight: '600' },
  aboutHeader:     { alignItems: 'center', marginBottom: 24 },
  aboutTitle:      { fontSize: 28, fontWeight: '700', color: '#2D3E2D', marginTop: 16, marginBottom: 4 },
  aboutVersion:    { fontSize: 14, color: '#999' },
  aboutSection:    { marginBottom: 24 },
  aboutSectionTitle:{ fontSize: 18, fontWeight: '700', color: '#2D3E2D', marginBottom: 12 },
  aboutText:       { fontSize: 14, color: '#666', lineHeight: 22 },
  featureList:     { gap: 12 },
  featureItem:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText:     { flex: 1, fontSize: 14, color: '#666' },
  infoGrid:        { flexDirection: 'row', gap: 12 },
  infoItem: {
    flex: 1, backgroundColor: '#F5F3EF', padding: 16,
    borderRadius: 12, alignItems: 'center', gap: 8,
  },
  infoLabel:       { fontSize: 12, color: '#666', textAlign: 'center' },
  infoValue:       { fontSize: 20, fontWeight: '700', color: '#2D3E2D' },
});