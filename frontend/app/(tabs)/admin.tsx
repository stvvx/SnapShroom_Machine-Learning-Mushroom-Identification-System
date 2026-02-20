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
  Text,
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

/* ─── Design Tokens ─── */
const COLORS = {
  forest:      '#1A2E1A',
  forestMid:   '#2D4A2D',
  moss:        '#4A6741',
  sage:        '#7A9E74',
  mint:        '#A8C5A0',
  cream:       '#F8F5EE',
  parchment:   '#EDE8DD',
  spore:       '#D4C9B0',
  mushCap:     '#C17B3F',
  mushGill:    '#E8A96A',
  mushStem:    '#F0D4A8',
  toxicRed:    '#C94040',
  safeGreen:   '#3A8C5C',
  unknownGray: '#8A8A8A',
  white:       '#FFFFFF',
  textDark:    '#1A2E1A',
  textMid:     '#4A6741',
  textLight:   '#7A9E74',
  shadow:      'rgba(26,46,26,0.12)',
};

/* ─── Mushroom SVG Stickers (inline as Unicode + styled) ─── */
const MushroomSticker = ({
  variant = 'red',
  size = 40,
  style,
}: {
  variant?: 'red' | 'brown' | 'white' | 'tiny';
  size?: number;
  style?: any;
}) => {
  const configs = {
    red:   { cap: '🍄', bg: 'rgba(201,64,64,0.12)',   border: 'rgba(201,64,64,0.25)' },
    brown: { cap: '🍄‍🟫', bg: 'rgba(193,123,63,0.12)', border: 'rgba(193,123,63,0.25)' },
    white: { cap: '🍄', bg: 'rgba(168,197,160,0.15)', border: 'rgba(122,158,116,0.3)' },
    tiny:  { cap: '🍄', bg: 'rgba(74,103,65,0.1)',    border: 'rgba(74,103,65,0.2)'  },
  };
  const cfg = configs[variant];
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: cfg.bg, borderWidth: 1.5,
      borderColor: cfg.border, alignItems: 'center',
      justifyContent: 'center',
    }, style]}>
      <Text style={{ fontSize: size * 0.5 }}>{cfg.cap}</Text>
    </View>
  );
};

/* ─── Decorative spore dots ─── */
const SporeDot = ({ size = 6, color = COLORS.mint, style }: any) => (
  <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.5 }, style]} />
);

const chartConfig = {
  backgroundGradientFrom: '#F8F5EE',
  backgroundGradientTo:   '#EDE8DD',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74,103,65,${opacity})`,
  labelColor:   () => COLORS.textMid,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.moss, fill: COLORS.cream },
  propsForBackgroundLines: {
    strokeDasharray: '3 5', stroke: COLORS.spore, strokeWidth: 1,
  },
};

const safeBarData = (items: { label: string; value: number }[], max = 5) => {
  const filtered = items.filter(i => typeof i.value === 'number').slice(0, max);
  if (filtered.length === 0) return { labels: ['No data'], datasets: [{ data: [0] }] };
  return {
    labels: filtered.map(i => (i.label.length > 8 ? i.label.slice(0, 7) + '…' : i.label)),
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
type Section = 'home' | 'users' | 'analytics';

/* ─── Reusable Card ─── */
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[s.card, style]}>{children}</View>
);

/* ─── Section Badge ─── */
const SectionBadge = ({ label, icon }: { label: string; icon: string }) => (
  <View style={s.sectionBadge}>
    <Text style={s.sectionBadgeIcon}>{icon}</Text>
    <Text style={s.sectionBadgeText}>{label}</Text>
  </View>
);

/* ─── Stat Card ─── */
const StatCard = ({
  icon,
  value,
  label,
  accent,
  emoji,
}: {
  icon: string;
  value: string | number;
  label: string;
  accent: string;
  emoji?: string;
}) => (
  <View style={[s.statCard, { borderTopColor: accent }]}>
    {emoji && <Text style={s.statEmoji}>{emoji}</Text>}
    <Text style={[s.statValue, { color: accent }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

/* ─── Export Button ─── */
const ExportButton = ({ onPress, label, icon = 'document-text' }: {
  onPress: () => void; label: string; icon?: string;
}) => (
  <TouchableOpacity style={s.exportBtn} onPress={onPress} activeOpacity={0.85}>
    <View style={s.exportBtnInner}>
      <Ionicons name={icon as any} size={18} color={COLORS.cream} />
      <Text style={s.exportBtnText}>{label}</Text>
    </View>
    <View style={s.exportBtnAccent}>
      <Ionicons name="arrow-forward" size={14} color={COLORS.mint} />
    </View>
  </TouchableOpacity>
);

/* ─── PDF export ─── */
const exportPDF = async (html: string, filename: string) => {
  try {
    Alert.alert('Generating PDF', 'Please wait…');
    const { uri } = await Print.printToFileAsync({
      html, base64: false,
      width: 595, height: 842, orientation: 'portrait',
    });
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error('PDF file was not created');
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
    if (accessToken && !api.defaults.headers.common.Authorization)
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  };

  const loadAnalytics = async () => {
    try {
      setAuthHeader();
      const res = await api.get('/admin/analytics');
      if (res.data.success) setAnalytics(res.data.analytics);
    } catch (error: any) {
      if (error.response?.status === 401)
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'Login', onPress: () => router.replace('/') },
        ]);
    }
  };

  const loadUsers = async () => {
    try {
      setAuthHeader();
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (error: any) {
      if (error.response?.status === 401)
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'Login', onPress: () => router.replace('/') },
        ]);
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

  /* ────────────────────────────────────────
     HOME SECTION
  ──────────────────────────────────────── */
  const renderHome = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingMushroom}>🍄</Text>
          <ActivityIndicator size="large" color={COLORS.moss} style={{ marginTop: 16 }} />
          <Text style={s.loadingText}>Gathering spores…</Text>
        </View>
      ) : analytics ? (
        <>
          {/* Hero banner */}
          <View style={s.heroBanner}>
            <View style={s.heroBannerDecor}>
              <MushroomSticker variant="red"   size={52} style={{ position: 'absolute', top: -10, right: 20, transform: [{ rotate: '12deg' }] }} />
              <MushroomSticker variant="brown" size={38} style={{ position: 'absolute', bottom: 8,  right: 72, transform: [{ rotate: '-8deg' }] }} />
              <SporeDot size={8}  color={COLORS.mint}  style={{ position: 'absolute', top: 18, right: 140 }} />
              <SporeDot size={5}  color={COLORS.mushGill} style={{ position: 'absolute', top: 38, right: 110 }} />
              <SporeDot size={10} color={COLORS.sage}  style={{ position: 'absolute', bottom: 18, right: 155 }} />
            </View>
            <Text style={s.heroBannerLabel}>ADMIN CONTROL CENTER</Text>
            <Text style={s.heroBannerTitle}>Overview</Text>
            <Text style={s.heroBannerSub}>All systems nominal · Forest index healthy</Text>
            <ExportButton
              onPress={() => exportPDF(buildOverviewReport(analytics, user.name), 'SnapShroom_Overview_Report.pdf')}
              label="Export Overview Report"
              icon="document-text"
            />
          </View>

          {/* Quick Actions */}
          <SectionBadge label="Quick Actions" icon="⚡" />
          <View style={s.quickActionsRow}>
            <TouchableOpacity
              style={[s.quickCard, { backgroundColor: COLORS.forestMid }]}
              onPress={() => setCurrentSection('users')}
              activeOpacity={0.85}
            >
              <Text style={s.quickCardEmoji}>👥</Text>
              <Text style={s.quickCardLabel}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickCard, { backgroundColor: COLORS.moss }]}
              onPress={() => setCurrentSection('analytics')}
              activeOpacity={0.85}
            >
              <Text style={s.quickCardEmoji}>📊</Text>
              <Text style={s.quickCardLabel}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickCard, { backgroundColor: COLORS.mushCap }]}
              onPress={() => loadAnalytics()}
              activeOpacity={0.85}
            >
              <Text style={s.quickCardEmoji}>🔄</Text>
              <Text style={s.quickCardLabel}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Overview Stats */}
          <SectionBadge label="Overview Statistics" icon="📊" />
          <View style={s.statsRow}>
            <StatCard icon="people" value={analytics.users.total_users}   label="Total Users"   accent={COLORS.moss}     emoji="👥" />
            <StatCard icon="check"  value={analytics.users.active_users}  label="Active"        accent={COLORS.safeGreen} emoji="✅" />
            <StatCard icon="scan"   value={analytics.mushrooms.total_scans} label="Total Scans" accent={COLORS.mushCap}   emoji="🔍" />
            <StatCard icon="cal"    value={analytics.mushrooms.scans_last_30d} label="30d Scans" accent={COLORS.sage}     emoji="📅" />
          </View>

          {/* Timeline Chart */}
          {analytics.timeline && analytics.timeline.length > 0 && (
            <>
              <SectionBadge label="Scan Timeline" icon="📈" />
              <Card>
                <Text style={s.cardSubLabel}>Daily scan activity</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels:   analytics.timeline.map(t => t.date),
                      datasets: [{ data: analytics.timeline.map(t => t.scans), color: () => COLORS.mushCap }],
                    }}
                    width={Math.max(CHART_WIDTH - 32, analytics.timeline.length * 52)}
                    height={200}
                    chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(193,123,63,${o})` }}
                    bezier
                    withShadow={false}
                    style={s.chart}
                  />
                </ScrollView>
              </Card>
            </>
          )}

          {/* User Status Rings */}
          <SectionBadge label="User Status Breakdown" icon="👤" />
          <Card>
            <Text style={s.cardSubLabel}>Active · Inactive · Admins (as % of total)</Text>
            <ProgressChart
              data={{
                labels: ['Active', 'Inactive', 'Admins'],
                data: [
                  analytics.users.total_users > 0 ? analytics.users.active_users   / analytics.users.total_users : 0,
                  analytics.users.total_users > 0 ? analytics.users.inactive_users / analytics.users.total_users : 0,
                  analytics.users.total_users > 0 ? analytics.users.admin_count    / analytics.users.total_users : 0,
                ],
              }}
              width={CHART_WIDTH - 32}
              height={180}
              strokeWidth={14}
              radius={36}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index?: number) => {
                  const colors = [
                    `rgba(58,140,92,${opacity})`,
                    `rgba(201,64,64,${opacity})`,
                    `rgba(74,103,65,${opacity})`,
                  ];
                  return colors[index ?? 0] ?? colors[0];
                },
              }}
              style={s.chart}
              hideLegend={false}
            />
          </Card>

          {/* Quick Info */}
          <SectionBadge label="Quick Info" icon="ℹ️" />
          <View style={s.infoRow}>
            <View style={s.infoTile}>
              <Text style={s.infoTileEmoji}>🛡️</Text>
              <Text style={s.infoTileValue}>{analytics.users.admin_count}</Text>
              <Text style={s.infoTileLabel}>Admins</Text>
            </View>
            <View style={s.infoTile}>
              <Text style={s.infoTileEmoji}>🎯</Text>
              <Text style={s.infoTileValue}>{analytics.mushrooms.detection_success_rate}%</Text>
              <Text style={s.infoTileLabel}>Success Rate</Text>
            </View>
            <View style={s.infoTile}>
              <Text style={s.infoTileEmoji}>📝</Text>
              <Text style={s.infoTileValue}>{analytics.users.recent_registrations_30d ?? '—'}</Text>
              <Text style={s.infoTileLabel}>New 30d</Text>
            </View>
          </View>

          {/* Decorative footer mushrooms */}
          <View style={s.decFooter}>
            <MushroomSticker variant="white" size={36} />
            <MushroomSticker variant="tiny"  size={24} style={{ marginHorizontal: 8 }} />
            <MushroomSticker variant="brown" size={36} />
            <MushroomSticker variant="tiny"  size={20} style={{ marginHorizontal: 8 }} />
            <MushroomSticker variant="red"   size={28} />
          </View>
        </>
      ) : (
        <View style={s.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🍄</Text>
          <Text style={s.emptyText}>No spores found yet</Text>
          <Text style={s.emptySubText}>Pull down to refresh</Text>
        </View>
      )}
    </View>
  );

  /* ────────────────────────────────────────
     USERS SECTION
  ──────────────────────────────────────── */
  const renderUsers = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingMushroom}>🍄</Text>
          <ActivityIndicator size="large" color={COLORS.moss} style={{ marginTop: 16 }} />
          <Text style={s.loadingText}>Loading user mycelium…</Text>
        </View>
      ) : (
        <>
          {/* Hero */}
          <View style={[s.heroBanner, { backgroundColor: COLORS.forestMid }]}>
            <View style={s.heroBannerDecor}>
              <MushroomSticker variant="white" size={48} style={{ position: 'absolute', top: -8, right: 16, transform: [{ rotate: '10deg' }] }} />
              <MushroomSticker variant="tiny"  size={30} style={{ position: 'absolute', bottom: 8, right: 68, transform: [{ rotate: '-6deg' }] }} />
            </View>
            <Text style={s.heroBannerLabel}>USER DIRECTORY</Text>
            <Text style={s.heroBannerTitle}>{users.length} Members</Text>
            <Text style={s.heroBannerSub}>Manage roles and access control</Text>
            {users.length > 0 && (
              <ExportButton
                onPress={() => exportPDF(buildUsersReport(users, user.name), 'SnapShroom_User_Directory.pdf')}
                label="Export User Directory"
                icon="people"
              />
            )}
          </View>

          <SectionBadge label="All Users" icon="👥" />

          <FlatList
            data={users}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View style={[s.userCard, index === 0 && { marginTop: 0 }]}>
                {/* Avatar circle */}
                <View style={[s.userAvatar, { backgroundColor: item.role === 'admin' ? COLORS.moss : COLORS.sage }]}>
                  <Text style={s.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  {item.role === 'admin' && (
                    <View style={s.adminBadgeDot}>
                      <Text style={{ fontSize: 8 }}>⭐</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.userInfo}>
                  <View style={s.userRow}>
                    <Text style={s.userName}>{item.name}</Text>
                    <View style={[s.rolePill, { backgroundColor: item.role === 'admin' ? COLORS.forest : COLORS.spore }]}>
                      <Text style={[s.rolePillText, { color: item.role === 'admin' ? COLORS.cream : COLORS.textMid }]}>
                        {item.role === 'admin' ? '⭐ Admin' : 'User'}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.userEmail}>{item.email}</Text>
                  <Text style={s.userMeta}>@{item.username}  ·  Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                  {item.last_login && (
                    <Text style={s.userMeta}>Last login {new Date(item.last_login).toLocaleDateString()}</Text>
                  )}

                  {/* Status indicator */}
                  <View style={s.statusRow}>
                    <View style={[s.statusDot, { backgroundColor: item.is_active ? COLORS.safeGreen : COLORS.toxicRed }]} />
                    <Text style={[s.statusText, { color: item.is_active ? COLORS.safeGreen : COLORS.toxicRed }]}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.actionPill, { backgroundColor: item.is_active ? 'rgba(201,64,64,0.1)' : 'rgba(58,140,92,0.1)' }]}
                      onPress={() => handleToggleUserStatus(item.id, item.is_active)}
                    >
                      <Text style={[s.actionPillText, { color: item.is_active ? COLORS.toxicRed : COLORS.safeGreen }]}>
                        {item.is_active ? '⊗ Deactivate' : '✓ Activate'}
                      </Text>
                    </TouchableOpacity>
                    {item.id !== user.id && (
                      <TouchableOpacity
                        style={[s.actionPill, { backgroundColor: 'rgba(74,103,65,0.1)' }]}
                        onPress={() => handleChangeRole(item.id, item.role)}
                      >
                        <Text style={[s.actionPillText, { color: COLORS.moss }]}>
                          {item.role === 'admin' ? '↓ Remove Admin' : '↑ Make Admin'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          />

          {/* Footer mushrooms */}
          <View style={s.decFooter}>
            <MushroomSticker variant="brown" size={32} />
            <MushroomSticker variant="tiny" size={20} style={{ marginHorizontal: 6 }} />
            <MushroomSticker variant="red" size={28} />
          </View>
        </>
      )}
    </View>
  );

  /* ────────────────────────────────────────
     ANALYTICS SECTION
  ──────────────────────────────────────── */
  const renderAnalytics = () => (
    <View style={s.contentContainer}>
      {loading ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingMushroom}>🍄</Text>
          <ActivityIndicator size="large" color={COLORS.moss} style={{ marginTop: 16 }} />
          <Text style={s.loadingText}>Analyzing mycelium network…</Text>
        </View>
      ) : analytics ? (
        <>
          {/* Hero */}
          <View style={[s.heroBanner, { backgroundColor: '#3B3020' }]}>
            <View style={s.heroBannerDecor}>
              <MushroomSticker variant="red"   size={50} style={{ position: 'absolute', top: -10, right: 14, transform: [{ rotate: '15deg' }] }} />
              <MushroomSticker variant="brown" size={34} style={{ position: 'absolute', bottom: 6,  right: 68, transform: [{ rotate: '-5deg' }] }} />
              <SporeDot size={7} color={COLORS.mushGill} style={{ position: 'absolute', top: 20, right: 130 }} />
              <SporeDot size={4} color={COLORS.mint}     style={{ position: 'absolute', top: 40, right: 105 }} />
            </View>
            <Text style={s.heroBannerLabel}>FULL ANALYTICS</Text>
            <Text style={s.heroBannerTitle}>Insights</Text>
            <Text style={s.heroBannerSub}>Scan trends, species data & locations</Text>
            <ExportButton
              onPress={() => exportPDF(buildAnalyticsReport(analytics, user.name), 'SnapShroom_Full_Analytics.pdf')}
              label="Export Full Analytics"
              icon="bar-chart"
            />
          </View>

          {/* User Analytics */}
          <SectionBadge label="User Analytics" icon="👥" />
          <View style={s.statsRow}>
            <StatCard value={analytics.users.total_users}    label="Total"    accent={COLORS.moss}       emoji="👥" />
            <StatCard value={analytics.users.active_users}   label="Active"   accent={COLORS.safeGreen}  emoji="✅" />
            <StatCard value={analytics.users.inactive_users} label="Inactive" accent={COLORS.toxicRed}   emoji="⭕" />
            <StatCard value={analytics.users.admin_count}    label="Admins"   accent={COLORS.mushCap}    emoji="⭐" />
          </View>

          <Card>
            <Text style={s.cardTitle}>User Composition</Text>
            <Text style={s.cardSubLabel}>Active vs Inactive vs Admins</Text>
            <BarChart
              data={{
                labels: ['Active', 'Inactive', 'Admins'],
                datasets: [{
                  data: [analytics.users.active_users, analytics.users.inactive_users, analytics.users.admin_count],
                  colors: [() => COLORS.safeGreen, () => COLORS.toxicRed, () => COLORS.moss],
                }],
              }}
              width={CHART_WIDTH - 32}
              height={200}
              fromZero
              showValuesOnTopOfBars
              withCustomBarColorFromData
              flatColor
              chartConfig={{ ...chartConfig, barPercentage: 0.6 }}
              style={s.chart}
            />
          </Card>

          {/* Mushroom Stats */}
          <SectionBadge label="Mushroom Analytics" icon="🍄" />
          <View style={s.statsRow}>
            <StatCard value={analytics.mushrooms.total_scans}         label="Total Scans"  accent={COLORS.mushCap}    emoji="🔍" />
            <StatCard value={analytics.mushrooms.scans_last_30d}      label="Last 30d"     accent={COLORS.sage}       emoji="📅" />
            <StatCard value={`${analytics.mushrooms.detection_success_rate}%`} label="Success" accent={COLORS.safeGreen} emoji="🎯" />
          </View>

          {/* Scan Timeline */}
          {analytics.timeline && analytics.timeline.length > 0 && (
            <>
              <SectionBadge label="Scan Timeline" icon="📈" />
              <Card>
                <Text style={s.cardSubLabel}>Daily scan activity over time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels:   analytics.timeline.map(t => t.date),
                      datasets: [{ data: analytics.timeline.map(t => t.scans) }],
                    }}
                    width={Math.max(CHART_WIDTH - 32, analytics.timeline.length * 52)}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    withShadow={false}
                    style={s.chart}
                  />
                </ScrollView>
              </Card>
            </>
          )}

          {/* Most Scanned */}
          {analytics.mushrooms.most_scanned_mushrooms.length > 0 && (
            <>
              <SectionBadge label="Most Scanned Mushrooms" icon="🏆" />
              <Card>
                {analytics.mushrooms.most_scanned_mushrooms.slice(0, 5).map((item, index) => (
                  <View key={index} style={s.rankRow}>
                    <View style={[s.rankCircle, { backgroundColor: index === 0 ? COLORS.mushCap : index === 1 ? COLORS.sage : COLORS.spore }]}>
                      <Text style={[s.rankNum, { color: index < 2 ? COLORS.white : COLORS.textMid }]}>#{index + 1}</Text>
                    </View>
                    <Text style={s.rankName}>{item.name}</Text>
                    <Text style={s.rankCount}>{item.count}</Text>
                  </View>
                ))}
                <Text style={[s.cardSubLabel, { marginTop: 16, marginBottom: 4 }]}>Scan Count Chart</Text>
                <BarChart
                  data={safeBarData(analytics.mushrooms.most_scanned_mushrooms.map(m => ({ label: m.name, value: m.count })))}
                  width={CHART_WIDTH - 32}
                  height={240}
                  fromZero
                  showValuesOnTopOfBars
                  chartConfig={{ ...chartConfig, barPercentage: 0.55, color: (o = 1) => `rgba(193,123,63,${o})` }}
                  style={s.chart}
                />
              </Card>
            </>
          )}

          {/* Top Locations */}
          {analytics.mushrooms.top_locations.length > 0 && (
            <>
              <SectionBadge label="Top Scan Locations" icon="📍" />
              <Card>
                {analytics.mushrooms.top_locations.slice(0, 5).map((item, index) => (
                  <View key={index} style={s.rankRow}>
                    <Text style={{ fontSize: 20 }}>📍</Text>
                    <Text style={s.rankName}>{item.location}</Text>
                    <Text style={s.rankCount}>{item.count} scans</Text>
                  </View>
                ))}
                <Text style={[s.cardSubLabel, { marginTop: 16, marginBottom: 4 }]}>Location Chart</Text>
                <BarChart
                  data={safeBarData(analytics.mushrooms.top_locations.map(l => ({ label: l.location, value: l.count })))}
                  width={CHART_WIDTH - 32}
                  height={240}
                  fromZero
                  showValuesOnTopOfBars
                  chartConfig={{ ...chartConfig, barPercentage: 0.55, color: (o = 1) => `rgba(122,158,116,${o})` }}
                  style={s.chart}
                />
              </Card>
            </>
          )}

          {/* Footer mushrooms */}
          <View style={s.decFooter}>
            <MushroomSticker variant="red"   size={36} />
            <MushroomSticker variant="tiny"  size={22} style={{ marginHorizontal: 8 }} />
            <MushroomSticker variant="brown" size={30} />
            <MushroomSticker variant="tiny"  size={18} style={{ marginHorizontal: 8 }} />
            <MushroomSticker variant="white" size={34} />
          </View>
        </>
      ) : (
        <View style={s.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🍄</Text>
          <Text style={s.emptyText}>No analytics data yet</Text>
          <Text style={s.emptySubText}>Pull down to refresh</Text>
        </View>
      )}
    </View>
  );



  /* ────────────────────────────────────────
     NAV TAB BAR
  ──────────────────────────────────────── */


  /* ────────────────────────────────────────
     ROOT RENDER
  ──────────────────────────────────────── */
  return (
    <ThemedView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        {/* Left cluster */}
        <View style={s.headerLeft}>
          <HamburgerMenu
            onAdminNavigate={(section) => setCurrentSection(section as Section)}
            currentSection={currentSection}
          />
          <NotificationDropdown iconColor={COLORS.mint} />
        </View>

        {/* Center */}
        <View style={s.headerCenter}>
          <Text style={s.headerLogo}>🍄</Text>
          <Text style={s.headerTitle}>SnapShroom</Text>
        </View>

        {/* Right: admin pill */}
        <View style={s.headerRight}>
          <View style={s.adminPill}>
            <Text style={s.adminPillText}>Admin</Text>
          </View>
        </View>
      </View>

      {/* ── Section subtitle bar ── */}
      <View style={s.subBar}>
        <Text style={s.subBarText}>
          {currentSection === 'home'      && 'Dashboard Overview'}
          {currentSection === 'users'     && 'User Management'}
          {currentSection === 'analytics' && 'Analytics & Insights'}
        </Text>
        <Text style={s.subBarUser}>⊕ {user.name}</Text>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.moss} />}
        showsVerticalScrollIndicator={false}
      >
        {currentSection === 'home'      && renderHome()}
        {currentSection === 'users'     && renderUsers()}
        {currentSection === 'analytics' && renderAnalytics()}
      </ScrollView>


    </ThemedView>
  );
}

/* ════════════════════════════════════════════
   STYLES
════════════════════════════════════════════ */
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.cream },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: COLORS.forest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,197,160,0.15)',
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight:  { flex: 1, alignItems: 'flex-end' },
  headerLogo:   { fontSize: 22 },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.cream, letterSpacing: 0.5 },
  adminPill: {
    backgroundColor: COLORS.moss,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  adminPillText: { color: COLORS.cream, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  /* ── Sub-bar ── */
  subBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.forestMid,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,197,160,0.1)',
  },
  subBarText: { color: COLORS.mint, fontSize: 13, fontWeight: '600' },
  subBarUser: { color: COLORS.sage,  fontSize: 12 },

  /* ── Content ── */
  contentContainer: { paddingHorizontal: 16, paddingTop: 16 },

  /* ── Loading / Empty ── */
  loadingContainer: { padding: 60, alignItems: 'center' },
  loadingMushroom:  { fontSize: 56 },
  loadingText:      { marginTop: 12, color: COLORS.textLight, fontSize: 15 },
  emptyContainer:   { padding: 60, alignItems: 'center' },
  emptyText:        { marginTop: 16, color: COLORS.textMid,   fontSize: 18, fontWeight: '700' },
  emptySubText:     { marginTop: 6,  color: COLORS.textLight, fontSize: 14 },

  /* ── Hero Banner ── */
  heroBanner: {
    backgroundColor: COLORS.forest,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroBannerDecor: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 180 },
  heroBannerLabel: {
    color: COLORS.mint, fontSize: 10, fontWeight: '800',
    letterSpacing: 2, marginBottom: 6,
  },
  heroBannerTitle: {
    color: COLORS.cream, fontSize: 32, fontWeight: '900',
    letterSpacing: -0.5, marginBottom: 4,
  },
  heroBannerSub: { color: COLORS.sage, fontSize: 13, marginBottom: 16 },

  /* ── Export Button ── */
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(168,197,160,0.25)',
    marginRight: 170,
  },
  exportBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportBtnText:  { color: COLORS.cream, fontSize: 13, fontWeight: '700' },
  exportBtnAccent:{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(168,197,160,0.2)', alignItems: 'center', justifyContent: 'center' },

  /* ── Section Badge ── */
  sectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10, marginTop: 4,
  },
  sectionBadgeIcon: { fontSize: 16 },
  sectionBadgeText: {
    fontSize: 13, fontWeight: '800', color: COLORS.textMid,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },

  /* ── Quick Actions ── */
  quickActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  quickCardEmoji: { fontSize: 28 },
  quickCardLabel: { color: COLORS.cream, fontSize: 12, fontWeight: '700' },

  /* ── Stat Cards ── */
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  statCard: {
    flex: 1, minWidth: (width - 52) / 2 - 10,
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 14, alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginTop: 2 },

  /* ── Card ── */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  cardSubLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  chart: { borderRadius: 12, alignSelf: 'center' },

  /* ── Rank rows ── */
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.parchment,
  },
  rankCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum:   { fontSize: 11, fontWeight: '800', color: COLORS.white },
  rankName:  { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  rankCount: { fontSize: 13, color: COLORS.textLight, fontWeight: '700' },

  /* ── Info Tiles ── */
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  infoTile: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  infoTileEmoji: { fontSize: 24, marginBottom: 6 },
  infoTileValue: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  infoTileLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginTop: 2 },

  /* ── Decorative Footer ── */
  decFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, gap: 6, marginBottom: 8,
  },

  /* ── User Cards ── */
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', gap: 14,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: 22, fontWeight: '900', color: COLORS.cream },
  adminBadgeDot: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.mushCap, borderRadius: 10,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  userInfo:   { flex: 1 },
  userRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  userName:   { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  rolePill: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  userEmail:  { fontSize: 13, color: COLORS.textMid, marginBottom: 2 },
  userMeta:   { fontSize: 11, color: COLORS.textLight, marginBottom: 4 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  actionRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  actionPillText: { fontSize: 12, fontWeight: '700' },

});