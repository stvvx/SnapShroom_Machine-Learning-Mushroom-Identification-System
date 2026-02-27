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
  useWindowDimensions,
  Text,
  Platform,
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
  shadow:      'rgba(26,46,26,0.10)',
  border:      'rgba(74,103,65,0.12)',
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

/* ─── Base chart config ─── */
const chartConfig = {
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo:   COLORS.white,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74,103,65,${opacity})`,
  labelColor:   () => COLORS.textMid,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.moss, fill: COLORS.white },
  propsForBackgroundLines: {
    strokeDasharray: '4 4',
    stroke: COLORS.border,
    strokeWidth: 1,
  },
  fillShadowGradientFrom: COLORS.sage,
  fillShadowGradientTo:   COLORS.white,
  fillShadowGradientOpacity: 0.15,
};

const mushroomChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(193,123,63,${opacity})`,
  fillShadowGradientFrom: COLORS.mushCap,
  fillShadowGradientOpacity: 0.12,
};

/* ─── Reusable Components ─── */
const SectionHeader = ({ title, subtitle, emoji }: { title: string; subtitle?: string; emoji?: string }) => (
  <View style={s.sectionHeader}>
    <View style={s.sectionHeaderLeft}>
      {emoji && <Text style={s.sectionEmoji}>{emoji}</Text>}
      <View>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  </View>
);

const Card = ({ children, style, title, subtitle }: {
  children: React.ReactNode; style?: any; title?: string; subtitle?: string;
}) => (
  <View style={[s.card, style]}>
    {(title || subtitle) && (
      <View style={s.cardHeader}>
        {title    && <Text style={s.cardTitle}>{title}</Text>}
        {subtitle && <Text style={s.cardSubtitle}>{subtitle}</Text>}
      </View>
    )}
    {children}
  </View>
);

const StatTile = ({ emoji, value, label, accentColor, wide = false }: {
  emoji: string; value: string | number; label: string; accentColor: string; wide?: boolean;
}) => (
  <View style={[s.statTile, wide && s.statTileWide]}>
    <View style={[s.statTileAccent, { backgroundColor: accentColor }]} />
    <Text style={s.statTileEmoji}>{emoji}</Text>
    <Text style={[s.statTileValue, { color: accentColor }]}>{value}</Text>
    <Text style={s.statTileLabel}>{label}</Text>
  </View>
);

const InlineStatRow = ({ items }: {
  items: { emoji: string; value: string | number; label: string; color: string }[];
}) => (
  <View style={s.inlineStatRow}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <View style={s.inlineDivider} />}
        <View style={s.inlineStat}>
          <Text style={s.inlineStatEmoji}>{item.emoji}</Text>
          <Text style={[s.inlineStatValue, { color: item.color }]}>{item.value}</Text>
          <Text style={s.inlineStatLabel}>{item.label}</Text>
        </View>
      </React.Fragment>
    ))}
  </View>
);

const RankItem = ({ rank, name, value, valueLabel = '' }: {
  rank: number; name: string; value: number; valueLabel?: string;
}) => {
  const rankColors     = [COLORS.mushCap, COLORS.sage, COLORS.spore];
  const rankTextColors = [COLORS.white, COLORS.white, COLORS.textMid];
  const bgColor  = rankColors[rank - 1]     ?? COLORS.parchment;
  const txtColor = rankTextColors[rank - 1] ?? COLORS.textMid;
  return (
    <View style={s.rankItem}>
      <View style={[s.rankBadge, { backgroundColor: bgColor }]}>
        <Text style={[s.rankBadgeText, { color: txtColor }]}>{rank}</Text>
      </View>
      <Text style={s.rankItemName} numberOfLines={1}>{name}</Text>
      <View style={s.rankItemRight}>
        <Text style={s.rankItemCount}>{value}</Text>
        {valueLabel ? <Text style={s.rankItemUnit}>{valueLabel}</Text> : null}
      </View>
    </View>
  );
};

const ExportButton = ({ onPress, label, icon = 'document-text-outline' }: {
  onPress: () => void; label: string; icon?: string;
}) => (
  <TouchableOpacity style={s.exportBtn} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon as any} size={15} color={COLORS.cream} />
    <Text style={s.exportBtnText}>{label}</Text>
    <Ionicons name="arrow-forward" size={13} color={COLORS.mint} />
  </TouchableOpacity>
);

/* ─── PDF export ─── */
const exportPDF = async (html: string, filename: string) => {
  try {
    Alert.alert('Generating PDF', 'Please wait…');

    // Web: open HTML in a new window and trigger browser print (no native file APIs)
    if (Platform.OS === 'web') {
      const w = window.open('', '_blank');
      if (!w) {
        Alert.alert('Export Failed', 'Unable to open print preview (popup blocked).');
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 600);
      return;
    }

    // Native (iOS / Android): create PDF file and share/save
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595,
      height: 842,
      orientation: 'portrait',
    });

    // Dynamically import legacy file system API to preserve `getInfoAsync`
    const FileSystem = (await import('expo-file-system/legacy')) as typeof import('expo-file-system/legacy');
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error('PDF file was not created');

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save ${filename}`, UTI: 'com.adobe.pdf' });
    } else {
      Alert.alert('PDF Saved', `Report saved to:\n${uri}`);
    }
  } catch (err: any) {
    Alert.alert('Export Failed', err?.message || 'Could not generate PDF.');
  }
};

/* ─── FIX: Custom legend for ProgressChart (replaces built-in side legend) ─── */
const ProgressLegend = ({ items }: {
  items: { label: string; color: string; pct: number }[];
}) => (
  <View style={s.progressLegend}>
    {items.map((item, i) => (
      <View key={i} style={s.progressLegendItem}>
        <View style={[s.progressLegendDot, { backgroundColor: item.color }]} />
        <Text style={s.progressLegendLabel}>{item.label}</Text>
        <Text style={[s.progressLegendPct, { color: item.color }]}>
          {Math.round(item.pct * 100)}%
        </Text>
      </View>
    ))}
  </View>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  // ─── Responsive layout via hook (re-renders on rotation/resize) ───
  const { width: screenWidth } = useWindowDimensions();
  const IS_WIDE = screenWidth >= 768;

  // Full-width chart (mobile): card has 16px padding each side, page 16px each side
  const FULL_CHART_W  = screenWidth - 48 - 32; // page padding + card padding
  // Half-width chart (web): two columns with 8px gap
  const HALF_CHART_W  = Math.floor((screenWidth - 48 - 8) / 2) - 32;
  // Which to use based on layout
  const CHART_W       = IS_WIDE ? HALF_CHART_W : FULL_CHART_W;

  // Bar column width per item:
  // Mobile: 70px — rotated labels are diagonal so bars can be closer
  // Web: 100px — two-line horizontal labels need more horizontal room
  const BAR_ITEM_W = IS_WIDE ? 100 : 70;
  // Mobile bar chart height — extra tall to give 45deg rotated labels room below bars
  const MOBILE_BAR_H = 300;
  const WEB_BAR_H = 240;

  // Inline styles for responsive rows
  const rowStyle  = { flexDirection: IS_WIDE ? 'row' as const : 'column' as const, gap: IS_WIDE ? 8 : 0, marginBottom: 16, alignItems: 'flex-start' as const };
  const halfStyle = { flex: IS_WIDE ? 1 : undefined, width: IS_WIDE ? undefined : '100%' as const, marginBottom: IS_WIDE ? 0 : 8 };

  // Label strategy:
  // Mobile: full label as-is, rotated 45deg so they never overlap
  // Web: split near middle with \n so they stack on two lines
  const formatBarLabel = (label: string): string => {
    if (!IS_WIDE) return label; // mobile: no modification, rotation handles overlap
    if (label.length <= 9) return label;
    const mid = Math.floor(label.length / 2);
    let splitAt = label.lastIndexOf(' ', mid);
    if (splitAt === -1) splitAt = label.indexOf(' ');
    if (splitAt === -1) return label.slice(0, 8) + '…';
    return label.slice(0, splitAt) + '\n' + label.slice(splitAt + 1);
  };

  // safeBarData — builds chart-ready labels + auto-calculates chart width
  const safeBarData = (items: { label: string; value: number }[], max = 5) => {
    const filtered = items.filter(i => typeof i.value === 'number').slice(0, max);
    if (filtered.length === 0) return { labels: ['No data'], datasets: [{ data: [0] }], chartWidth: CHART_W };
    return {
      labels:     filtered.map(i => formatBarLabel(i.label)),
      datasets:   [{ data: filtered.map(i => i.value) }],
      chartWidth: Math.max(CHART_W, filtered.length * BAR_ITEM_W),
    };
  };

  // Timeline labels
  const timelineLabels = (tl: { date: string; scans: number }[]) => {
    const step = IS_WIDE ? 4 : 3;
    return tl.map((t, i) => {
      if (i % step !== 0 && i !== tl.length - 1) return '';
      const parts = t.date.split('-');
      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : t.date;
    });
  };

  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [analytics, setAnalytics]           = useState<Analytics | null>(null);
  const [users, setUsers]                   = useState<User[]>([]);
  const [isConfirmingRole, setIsConfirmingRole] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: string; actionLabel: string } | null>(null);

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
      if (currentSection === 'home')           await loadAnalytics();
      else if (currentSection === 'users')     await loadUsers();
      else if (currentSection === 'analytics') await loadAnalytics();
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
      setAuthHeader();
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
    setAuthHeader();
    const newIsAdmin  = currentRole === 'admin' ? 0 : 1;
    const newRole     = newIsAdmin === 1 ? 'admin' : 'user';
    const actionLabel = newIsAdmin === 1 ? 'Make Admin' : 'Make User';

    if (Platform.OS === 'web') {
      // On web, use custom modal instead of window.confirm
      setPendingRoleChange({ userId, newRole: newRole, actionLabel });
      setIsConfirmingRole(true);
    } else {
      // On native, use Alert.alert
      Alert.alert('Confirm Role Change', `${actionLabel}? This will change the role to ${newRole}.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          onPress: async () => {
            try {
              const res = await api.put(`/admin/users/${userId}/role`, { is_admin: newIsAdmin });
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
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    setIsConfirmingRole(false);
    const { userId, newRole } = pendingRoleChange;
    const newIsAdmin = newRole === 'admin' ? 1 : 0;

    try {
      const res = await api.put(`/admin/users/${userId}/role`, { is_admin: newIsAdmin });
      if (res.data.success) {
        Alert.alert('Success', res.data.message);
        await loadUsers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change role');
    }
    setPendingRoleChange(null);
  };

  const handleCancelRoleChange = () => {
    setIsConfirmingRole(false);
    setPendingRoleChange(null);
  };

  if (!user || user.role !== 'admin') {
    return (
      <ThemedView style={s.container}>
        <ThemedText>Access Denied</ThemedText>
      </ThemedView>
    );
  }

  const renderLoading = (message: string) => (
    <View style={s.loadingContainer}>
      <Text style={s.loadingIcon}>🍄</Text>
      <ActivityIndicator size="large" color={COLORS.moss} style={{ marginTop: 12 }} />
      <Text style={s.loadingText}>{message}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <Text style={{ fontSize: 56 }}>🍄</Text>
      <Text style={s.emptyTitle}>No data yet</Text>
      <Text style={s.emptySubtitle}>Pull down to refresh</Text>
    </View>
  );

  /* ════════════════════════════════════════════
     HOME SECTION
  ════════════════════════════════════════════ */
  const renderHome = () => {
    if (loading)    return renderLoading('Gathering spores…');
    if (!analytics) return renderEmpty();

    const { users: U, mushrooms: M, timeline } = analytics;

    // FIX: progress chart data & legend items defined once, reused in both mobile and web
    const progressData = {
      labels: ['Active', 'Inactive', 'Admins'],
      data: [
        U.total_users > 0 ? U.active_users   / U.total_users : 0,
        U.total_users > 0 ? U.inactive_users / U.total_users : 0,
        U.total_users > 0 ? U.admin_count    / U.total_users : 0,
      ],
    };
    const progressLegendItems = [
      { label: 'Active',   color: `rgba(58,140,92,1)`,   pct: progressData.data[0] },
      { label: 'Inactive', color: `rgba(201,64,64,1)`,   pct: progressData.data[1] },
      { label: 'Admins',   color: `rgba(74,103,65,1)`,   pct: progressData.data[2] },
    ];
    const progressChartConfig = {
      ...chartConfig,
      color: (opacity = 1, index?: number) => {
        const colors = [`rgba(58,140,92,${opacity})`, `rgba(201,64,64,${opacity})`, `rgba(74,103,65,${opacity})`];
        return colors[index ?? 0] ?? colors[0];
      },
    };

    return (
      <View style={s.page}>

        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageHeaderEyebrow}>ADMIN DASHBOARD</Text>
            <Text style={s.pageHeaderTitle}>Overview</Text>
            <Text style={s.pageHeaderSub}>Forest index healthy · All systems normal</Text>
          </View>
          <Text style={{ fontSize: 44 }}>🍄</Text>
        </View>

        <SectionHeader title="Quick Actions" emoji="⚡" />
        <View style={s.quickRow}>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: COLORS.forestMid }]} onPress={() => setCurrentSection('users')} activeOpacity={0.85}>
            <Text style={s.quickBtnEmoji}>👥</Text>
            <Text style={s.quickBtnLabel}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: COLORS.moss }]} onPress={() => setCurrentSection('analytics')} activeOpacity={0.85}>
            <Text style={s.quickBtnEmoji}>📊</Text>
            <Text style={s.quickBtnLabel}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: COLORS.mushCap }]} onPress={loadAnalytics} activeOpacity={0.85}>
            <Text style={s.quickBtnEmoji}>🔄</Text>
            <Text style={s.quickBtnLabel}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="At a Glance" emoji="📊" />
        <View style={s.statGrid}>
          <StatTile emoji="👥" value={U.total_users}    label="Total Users"  accentColor={COLORS.moss} />
          <StatTile emoji="✅" value={U.active_users}   label="Active Users" accentColor={COLORS.safeGreen} />
          <StatTile emoji="🔍" value={M.total_scans}    label="Total Scans"  accentColor={COLORS.mushCap} />
          <StatTile emoji="📅" value={M.scans_last_30d} label="Scans (30d)"  accentColor={COLORS.sage} />
        </View>

        <Card style={s.mb16}>
          <InlineStatRow items={[
            { emoji: '🛡️', value: U.admin_count,                     label: 'Admins',    color: COLORS.moss },
            { emoji: '🎯', value: `${M.detection_success_rate}%`,    label: 'Success',   color: COLORS.safeGreen },
            { emoji: '📝', value: U.recent_registrations_30d ?? '—', label: 'New (30d)', color: COLORS.mushCap },
          ]} />
        </Card>

        {/* ── Scan Timeline ── */}
        <SectionHeader title="Scan Timeline" subtitle="Daily scan activity" emoji="📈" />
        <View style={rowStyle}>
          <View style={halfStyle}>
            <Card style={s.mb0}>
              {timeline && timeline.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels:   timelineLabels(timeline),
                      datasets: [{ data: timeline.map(t => t.scans) }],
                    }}
                    width={Math.max(CHART_W, timeline.length * (IS_WIDE ? 32 : 52))}
                    height={200}
                    chartConfig={mushroomChartConfig}
                    bezier
                    withShadow={false}
                    style={s.chart}
                  />
                </ScrollView>
              ) : (
                <View style={s.chartPlaceholder}><Text style={s.chartPlaceholderText}>No data yet</Text></View>
              )}
            </Card>
          </View>

          {/* On web: user breakdown right beside timeline */}
          {IS_WIDE && (
            <View style={halfStyle}>
              <Card style={s.mb0} title="User Breakdown" subtitle="Active · Inactive · Admins">
                <ProgressChart
                  data={progressData}
                  width={CHART_W}
                  height={200}
                  strokeWidth={14}
                  radius={36}
                  chartConfig={progressChartConfig}
                  style={s.chart}
                  hideLegend={false}
                />
              </Card>
            </View>
          )}
        </View>

        {/* FIX: On mobile, User Breakdown uses hideLegend + custom legend below */}
        {!IS_WIDE && (
          <>
            <SectionHeader title="User Breakdown" subtitle="Active · Inactive · Admins" emoji="👤" />
            <Card>
              <ProgressChart
                data={progressData}
                width={FULL_CHART_W}
                height={220}
                strokeWidth={16}
                radius={42}
                chartConfig={progressChartConfig}
                style={s.chart}
                hideLegend={true}
              />
              {/* Custom legend below the chart so labels are fully visible */}
              <ProgressLegend items={progressLegendItems} />
            </Card>
          </>
        )}

        <SectionHeader title="Reports" emoji="📄" />
        <Card style={s.mb24}>
          <ExportButton
            onPress={() => exportPDF(buildOverviewReport(analytics, user.name), 'SnapShroom_Overview_Report.pdf')}
            label="Export Overview Report"
            icon="document-text-outline"
          />
        </Card>

      </View>
    );
  };

  /* ════════════════════════════════════════════
     USERS SECTION
  ════════════════════════════════════════════ */
  const renderUsers = () => {
    if (loading) return renderLoading('Loading user mycelium…');

    return (
      <View style={s.page}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageHeaderEyebrow}>USER DIRECTORY</Text>
            <Text style={s.pageHeaderTitle}>{users.length} Members</Text>
            <Text style={s.pageHeaderSub}>Manage roles and access control</Text>
          </View>
          <Text style={{ fontSize: 44 }}>👥</Text>
        </View>

        {users.length > 0 && (
          <Card style={s.mb20}>
            <ExportButton
              onPress={() => exportPDF(buildUsersReport(users, user.name), 'SnapShroom_User_Directory.pdf')}
              label="Export User Directory"
              icon="people-outline"
            />
          </Card>
        )}

        <SectionHeader title="All Users" subtitle={`${users.length} registered accounts`} emoji="👥" />

        <FlatList
          data={users}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={s.userCard}>
              <View style={s.userCardTop}>
                <View style={[s.avatar, { backgroundColor: item.role === 'admin' ? COLORS.moss : COLORS.sage }]}>
                  <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  {item.role === 'admin' && (
                    <View style={s.avatarBadge}><Text style={{ fontSize: 8 }}>⭐</Text></View>
                  )}
                </View>
                <View style={s.userCardMeta}>
                  <View style={s.userCardNameRow}>
                    <Text style={s.userCardName} numberOfLines={1}>{item.name}</Text>
                    <View style={[s.rolePill, { backgroundColor: item.role === 'admin' ? COLORS.forest : COLORS.parchment }]}>
                      <Text style={[s.rolePillText, { color: item.role === 'admin' ? COLORS.cream : COLORS.textMid }]}>
                        {item.role === 'admin' ? '⭐ Admin' : 'User'}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.userCardEmail}>{item.email}</Text>
                  <Text style={s.userCardInfo}>@{item.username} · Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={s.userCardDivider} />
              <View style={s.userCardStatusRow}>
                <View style={s.statusBadge}>
                  <View style={[s.statusDot, { backgroundColor: item.is_active ? COLORS.safeGreen : COLORS.toxicRed }]} />
                  <Text style={[s.statusLabel, { color: item.is_active ? COLORS.safeGreen : COLORS.toxicRed }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                {item.last_login && (
                  <Text style={s.lastLoginText}>Last login {new Date(item.last_login).toLocaleDateString()}</Text>
                )}
              </View>
              <View style={s.userCardActions}>
                <TouchableOpacity
                  style={[s.actionBtn, {
                    backgroundColor: item.is_active ? 'rgba(201,64,64,0.08)' : 'rgba(58,140,92,0.08)',
                    borderColor:     item.is_active ? 'rgba(201,64,64,0.2)'  : 'rgba(58,140,92,0.2)',
                  }]}
                  onPress={() => handleToggleUserStatus(item.id, item.is_active)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="power" size={14} color={item.is_active ? COLORS.toxicRed : COLORS.safeGreen} />
                  <Text style={[s.actionBtnText, { color: item.is_active ? COLORS.toxicRed : COLORS.safeGreen }]}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                {item.id !== user.id && (
                  <TouchableOpacity
                    style={[s.actionBtn, {
                      backgroundColor: item.role === 'admin' ? COLORS.forest : COLORS.white,
                      borderColor:     item.role === 'admin' ? COLORS.forest : COLORS.moss,
                    }]}
                    onPress={() => handleChangeRole(item.id, item.role)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.role === 'admin' ? 'shield-checkmark' : 'person-outline'}
                      size={14}
                      color={item.role === 'admin' ? COLORS.cream : COLORS.moss}
                    />
                    <Text style={[s.actionBtnText, { color: item.role === 'admin' ? COLORS.cream : COLORS.moss }]}>
                      {item.role === 'admin' ? 'Admin' : 'User'}
                    </Text>
                    <Ionicons
                      name="swap-horizontal" size={13}
                      color={item.role === 'admin' ? COLORS.mint : COLORS.textLight}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  /* ════════════════════════════════════════════
     ANALYTICS SECTION
  ════════════════════════════════════════════ */
  const renderAnalytics = () => {
    if (loading)    return renderLoading('Analyzing mycelium network…');
    if (!analytics) return renderEmpty();

    const { users: U, mushrooms: M, timeline } = analytics;

    // FIX: progress chart config & legend items (same pattern as home)
    const progressChartConfig = {
      ...chartConfig,
      color: (opacity = 1, index?: number) => {
        const colors = [`rgba(58,140,92,${opacity})`, `rgba(201,64,64,${opacity})`, `rgba(74,103,65,${opacity})`];
        return colors[index ?? 0] ?? colors[0];
      },
    };

    return (
      <View style={s.page}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageHeaderEyebrow}>FULL ANALYTICS</Text>
            <Text style={s.pageHeaderTitle}>Insights</Text>
            <Text style={s.pageHeaderSub}>Scan trends, species & locations</Text>
          </View>
          <Text style={{ fontSize: 44 }}>📊</Text>
        </View>

        {/* ═══ USER STATS ═══ */}
        <SectionHeader title="User Analytics" emoji="👥" />
        <View style={s.statGrid}>
          <StatTile emoji="👥" value={U.total_users}    label="Total"    accentColor={COLORS.moss} />
          <StatTile emoji="✅" value={U.active_users}   label="Active"   accentColor={COLORS.safeGreen} />
          <StatTile emoji="⭕" value={U.inactive_users} label="Inactive" accentColor={COLORS.toxicRed} />
          <StatTile emoji="⭐" value={U.admin_count}    label="Admins"   accentColor={COLORS.mushCap} />
        </View>

        {/* ── User Composition chart ── */}
        <SectionHeader title="User Composition" subtitle="Active vs Inactive vs Admins" emoji="📊" />
        <View style={rowStyle}>
          <View style={halfStyle}>
            <Card style={s.mb0}>
              {/* FIX: wrap in ScrollView so bars never get clipped */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: ['Active', 'Inactive', 'Admins'],
                    datasets: [{
                      data: [U.active_users, U.inactive_users, U.admin_count],
                      colors: [() => COLORS.safeGreen, () => COLORS.toxicRed, () => COLORS.moss],
                    }],
                  }}
                  width={Math.max(CHART_W, 3 * BAR_ITEM_W)}
                  height={200}
                  fromZero
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
                  flatColor
                  chartConfig={{ ...chartConfig, barPercentage: 0.55 }}
                  style={s.chart}
                />
              </ScrollView>
            </Card>
          </View>

          {/* On web, scan timeline goes beside user composition */}
          {IS_WIDE && timeline && timeline.length > 0 && (
            <View style={halfStyle}>
              <Card style={s.mb0} title="Scan Timeline" subtitle="Daily activity">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels:   timelineLabels(timeline),
                      datasets: [{ data: timeline.map(t => t.scans) }],
                    }}
                    width={Math.max(CHART_W, timeline.length * 32)}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    withShadow={false}
                    style={s.chart}
                  />
                </ScrollView>
              </Card>
            </View>
          )}
        </View>

        {/* On mobile: scan timeline gets its own full-width section */}
        {!IS_WIDE && timeline && timeline.length > 0 && (
          <>
            <SectionHeader title="Scan Timeline" subtitle="Daily scan activity" emoji="📈" />
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels:   timelineLabels(timeline),
                    datasets: [{ data: timeline.map(t => t.scans) }],
                  }}
                  width={Math.max(FULL_CHART_W, timeline.length * 52)}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  withShadow={false}
                  style={s.chart}
                />
              </ScrollView>
            </Card>
          </>
        )}

        {/* ═══ MUSHROOM STATS ═══ */}
        <SectionHeader title="Mushroom Analytics" emoji="🍄" />
        <View style={s.statGridThree}>
          <StatTile emoji="🔍" value={M.total_scans}                   label="Total Scans"  accentColor={COLORS.mushCap} wide />
          <StatTile emoji="📅" value={M.scans_last_30d}                label="Last 30d"     accentColor={COLORS.sage}    wide />
          <StatTile emoji="🎯" value={`${M.detection_success_rate}%`} label="Success Rate" accentColor={COLORS.safeGreen} wide />
        </View>

        {/* ═══ RANK LISTS ═══ */}
        {(M.most_scanned_mushrooms.length > 0 || M.top_locations.length > 0) && (
          <View style={rowStyle}>
            {M.most_scanned_mushrooms.length > 0 && (
              <View style={halfStyle}>
                <SectionHeader title="Top Species" subtitle="Most scanned" emoji="🏆" />
                <Card style={s.mb0}>
                  {M.most_scanned_mushrooms.slice(0, 5).map((item, i) => (
                    <RankItem key={i} rank={i + 1} name={item.name} value={item.count} valueLabel="scans" />
                  ))}
                </Card>
              </View>
            )}
          
          </View>
        )}

        {/* ═══ SPECIES CHART ═══ — FIX: always in ScrollView, width computed from item count */}
        {M.most_scanned_mushrooms.length > 0 && (
          <>
            <SectionHeader title="Species Chart" subtitle="Scan count by mushroom" emoji="🍄" />
            <View style={rowStyle}>
              <View style={halfStyle}>
                <Card style={s.mb0}>
                  {/* FIX: horizontal scroll + wider chart so wrapped labels fit */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(() => {
                      const bd = safeBarData(M.most_scanned_mushrooms.map(m => ({ label: m.name, value: m.count })));
                      return (
                        <BarChart
                          data={{ labels: bd.labels, datasets: bd.datasets }}
                          width={bd.chartWidth}
                          height={IS_WIDE ? WEB_BAR_H : MOBILE_BAR_H}
                          fromZero
                          showValuesOnTopOfBars
                          chartConfig={{ ...mushroomChartConfig, barPercentage: 0.55 }}
                          style={s.chart}
                          verticalLabelRotation={IS_WIDE ? 0 : 45}
                        />
                      );
                    })()}
                  </ScrollView>
                </Card>
              </View>

            
            </View>
          </>
        )}

      

        {/* ═══ EXPORT ═══ */}
        <SectionHeader title="Reports" emoji="📄" />
        <Card style={s.mb24}>
          <ExportButton
            onPress={() => exportPDF(buildAnalyticsReport(analytics, user.name), 'SnapShroom_Full_Analytics.pdf')}
            label="Export Full Analytics"
            icon="bar-chart-outline"
          />
        </Card>

      </View>
    );
  };

  /* ════════════════════════════════════════════
     ROOT RENDER
  ════════════════════════════════════════════ */
  return (
    <ThemedView style={s.container}>

      <View style={s.topHeader}>
        <View style={s.topHeaderLeft}>
          <HamburgerMenu
            onAdminNavigate={(section) => setCurrentSection(section as Section)}
            currentSection={currentSection}
          />
          <NotificationDropdown iconColor={COLORS.mint} />
        </View>
        <View style={s.topHeaderCenter}>
          <Text style={s.topHeaderLogo}>🍄</Text>
          <Text style={s.topHeaderTitle}>SnapShroom</Text>
        </View>
        <View style={s.topHeaderRight}>
          <View style={s.adminBadge}>
            <Text style={s.adminBadgeText}>Admin</Text>
          </View>
        </View>
      </View>

      <View style={s.tabBar}>
        {(['home', 'users', 'analytics'] as Section[]).map(section => {
          const labels: Record<Section, { label: string; emoji: string }> = {
            home:      { label: 'Overview',  emoji: '🏠' },
            users:     { label: 'Users',     emoji: '👥' },
            analytics: { label: 'Analytics', emoji: '📊' },
          };
          const isActive = currentSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[s.tabItem, isActive && s.tabItemActive]}
              onPress={() => setCurrentSection(section)}
              activeOpacity={0.85}
            >
              <Text style={[s.tabEmoji, isActive && s.tabEmojiActive]}>{labels[section].emoji}</Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{labels[section].label}</Text>
              {isActive && <View style={s.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.contextStrip}>
        <Text style={s.contextUser}>⊕ {user.name}</Text>
        <Text style={s.contextSection}>
          {currentSection === 'home'      && 'Dashboard Overview'}
          {currentSection === 'users'     && 'User Management'}
          {currentSection === 'analytics' && 'Analytics & Insights'}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.cream }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.moss} />}
        showsVerticalScrollIndicator={false}
      >
        {currentSection === 'home'      && renderHome()}
        {currentSection === 'users'     && renderUsers()}
        {currentSection === 'analytics' && renderAnalytics()}
      </ScrollView>

      {/* Custom Role Change Confirmation Modal */}
      {isConfirmingRole && pendingRoleChange && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Confirm Role Change</Text>
            <Text style={s.modalMessage}>
              {pendingRoleChange.actionLabel}? This will change the role to {pendingRoleChange.newRole}.
            </Text>
            <View style={s.modalButtonRow}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={handleCancelRoleChange}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnConfirm]}
                onPress={handleConfirmRoleChange}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnConfirmText}>{pendingRoleChange.actionLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </ThemedView>
  );
}

/* ════════════════════════════════════════════
   STYLES
════════════════════════════════════════════ */
const s = StyleSheet.create({

  container: { flex: 1, backgroundColor: COLORS.cream },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: COLORS.forest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,197,160,0.12)',
  },
  topHeaderLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  topHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topHeaderRight:  { flex: 1, alignItems: 'flex-end' },
  topHeaderLogo:   { fontSize: 22 },
  topHeaderTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.cream, letterSpacing: 0.4 },
  adminBadge: {
    backgroundColor: COLORS.moss,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: { color: COLORS.cream, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.forestMid,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,197,160,0.12)',
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, position: 'relative',
  },
  tabItemActive: { backgroundColor: 'rgba(168,197,160,0.1)' },
  tabEmoji:       { fontSize: 16 },
  tabEmojiActive: { transform: [{ scale: 1.1 }] },
  tabLabel:       { fontSize: 11, color: COLORS.sage, fontWeight: '600' },
  tabLabelActive: { color: COLORS.mint, fontWeight: '800' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2.5, backgroundColor: COLORS.mint, borderRadius: 2,
  },

  contextStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.parchment,
    borderBottomWidth: 1, borderBottomColor: COLORS.spore,
  },
  contextUser:    { color: COLORS.textLight, fontSize: 12 },
  contextSection: { color: COLORS.textMid,   fontSize: 12, fontWeight: '700' },

  page: { paddingHorizontal: 16, paddingTop: 20 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.forest, borderRadius: 18, padding: 20, marginBottom: 24,
  },
  pageHeaderEyebrow: { color: COLORS.mint, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  pageHeaderTitle:   { color: COLORS.cream, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  pageHeaderSub:     { color: COLORS.sage, fontSize: 12 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, marginTop: 4,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionEmoji:      { fontSize: 18 },
  sectionTitle:      { fontSize: 14, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.2 },
  sectionSubtitle:   { fontSize: 11, color: COLORS.textLight, marginTop: 1 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: COLORS.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader:   { marginBottom: 14 },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  cardSubtitle: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  chart:        { borderRadius: 10, alignSelf: 'center' },

  chartPlaceholder:     { height: 100, alignItems: 'center', justifyContent: 'center' },
  chartPlaceholderText: { color: COLORS.textLight, fontSize: 12 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statTile: {
    width: (Dimensions.get('window').width - 48 - 10) / 2,
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    alignItems: 'flex-start', overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  statTileWide: { width: (Dimensions.get('window').width - 48 - 20) / 3 },
  statTileAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  statTileEmoji: { fontSize: 24, marginBottom: 8, marginTop: 4 },
  statTileValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
  statTileLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },

  statGridThree: { flexDirection: 'row', gap: 8, marginBottom: 16 },

  inlineStatRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 4 },
  inlineDivider:   { width: 1, height: 40, backgroundColor: COLORS.border },
  inlineStat:      { flex: 1, alignItems: 'center', gap: 3 },
  inlineStatEmoji: { fontSize: 20 },
  inlineStatValue: { fontSize: 20, fontWeight: '900' },
  inlineStatLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  quickBtnEmoji: { fontSize: 24 },
  quickBtnLabel: { color: COLORS.cream, fontSize: 12, fontWeight: '700' },

  rankItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.parchment,
  },
  rankBadge:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.spore },
  rankBadgeText: { fontSize: 12, fontWeight: '800' },
  rankItemName:  { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  rankItemRight: { alignItems: 'flex-end' },
  rankItemCount: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
  rankItemUnit:  { fontSize: 10, color: COLORS.textLight },

  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.moss, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start',
  },
  exportBtnText: { color: COLORS.cream, fontSize: 13, fontWeight: '700', flex: 1 },

  loadingContainer: { paddingVertical: 80, alignItems: 'center' },
  loadingIcon:      { fontSize: 56 },
  loadingText:      { marginTop: 14, color: COLORS.textLight, fontSize: 14 },
  emptyContainer:   { paddingVertical: 80, alignItems: 'center' },
  emptyTitle:       { marginTop: 16, color: COLORS.textDark, fontSize: 18, fontWeight: '800' },
  emptySubtitle:    { marginTop: 6, color: COLORS.textLight, fontSize: 13 },

  userCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: COLORS.forest, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  userCardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 20, fontWeight: '900', color: COLORS.cream },
  avatarBadge: {
    position: 'absolute', bottom: -1, right: -1,
    backgroundColor: COLORS.mushCap, borderRadius: 9,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  userCardMeta: { flex: 1 },
  userCardNameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3,
  },
  userCardName:  { fontSize: 15, fontWeight: '800', color: COLORS.textDark, flex: 1, marginRight: 6 },
  rolePill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  rolePillText:  { fontSize: 10, fontWeight: '700' },
  userCardEmail: { fontSize: 13, color: COLORS.textMid, marginBottom: 2 },
  userCardInfo:  { fontSize: 11, color: COLORS.textLight },
  userCardDivider: { height: 1, backgroundColor: COLORS.parchment, marginBottom: 12 },
  userCardStatusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusLabel:   { fontSize: 12, fontWeight: '700' },
  lastLoginText: { fontSize: 11, color: COLORS.textLight },
  userCardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // FIX: Custom ProgressChart legend styles
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  progressLegendItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  progressLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLegendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  progressLegendPct: {
    fontSize: 13,
    fontWeight: '800',
  },

  mb0:  { marginBottom: 0 },
  mb8:  { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 18, padding: 24,
    width: '85%', maxWidth: 400,
    shadowColor: COLORS.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15, color: COLORS.textMid, lineHeight: 22, marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  modalBtn: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.parchment, borderWidth: 1, borderColor: COLORS.border,
  },
  modalBtnCancelText: {
    fontSize: 14, fontWeight: '700', color: COLORS.textMid,
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.moss,
  },
  modalBtnConfirmText: {
    fontSize: 14, fontWeight: '700', color: COLORS.cream,
  },
});