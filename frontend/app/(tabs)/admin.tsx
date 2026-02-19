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

/* ─── PDF export helper with proper print options ─── */
const exportPDF = async (html: string, filename: string) => {
  try {
    Alert.alert('Generating PDF', 'Please wait...');
    
    const { uri } = await Print.printToFileAsync({ 
      html, 
      base64: false,
      width: 595, // A4 width in points
      height: 842, // A4 height in points
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

/* ─── Helper functions to generate focused reports ─── */
const generateOverviewStatsHTML = (analytics: Analytics, adminName: string) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Overview Statistics</title>
      <style>
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; }
        }
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          color: #0F1A0F;
          line-height: 1.5;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #1E3020;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1E3020;
          font-size: 28px;
          margin: 0 0 5px 0;
        }
        .header p {
          color: #6B7C6B;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #F7FAF7;
          border: 1px solid #C8D8C8;
          border-radius: 8px;
          padding: 20px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #1E3020;
          margin: 0 0 5px 0;
        }
        .stat-label {
          color: #6B7C6B;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1E3020;
          color: #fff;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #C8D8C8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C8D8C8;
          font-size: 12px;
          color: #6B7C6B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SnapShroom Overview Statistics</h1>
        <p>Generated: ${now} | Prepared by: ${adminName}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${analytics.users.total_users}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${analytics.users.active_users}</div>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${analytics.mushrooms.total_scans}</div>
          <div class="stat-label">Total Scans</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${analytics.mushrooms.scans_last_30d}</div>
          <div class="stat-label">Scans (30 Days)</div>
        </div>
      </div>

      <h2 style="color: #1E3020;">User Status</h2>
      <table>
        <tr>
          <th>Status</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
        <tr>
          <td>Active Users</td>
          <td>${analytics.users.active_users}</td>
          <td>${((analytics.users.active_users / analytics.users.total_users) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Inactive Users</td>
          <td>${analytics.users.inactive_users}</td>
          <td>${((analytics.users.inactive_users / analytics.users.total_users) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Administrators</td>
          <td>${analytics.users.admin_count}</td>
          <td>${((analytics.users.admin_count / analytics.users.total_users) * 100).toFixed(1)}%</td>
        </tr>
      </table>

      <h2 style="color: #1E3020; margin-top: 30px;">Scan Information</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Detection Success Rate</td>
          <td>${analytics.mushrooms.detection_success_rate}%</td>
        </tr>
        <tr>
          <td>Edible Scans</td>
          <td>${analytics.mushrooms.edible_vs_toxic.edible}</td>
        </tr>
        <tr>
          <td>Toxic Scans</td>
          <td>${analytics.mushrooms.edible_vs_toxic.toxic}</td>
        </tr>
        <tr>
          <td>Unknown Classification</td>
          <td>${analytics.mushrooms.edible_vs_toxic.unknown}</td>
        </tr>
      </table>

      <div class="footer">
        <p>Confidential - SnapShroom Internal Report</p>
      </div>
    </body>
    </html>
  `;
};

const generateScanTimelineHTML = (analytics: Analytics, adminName: string) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const totalScans = analytics.timeline.reduce((sum, day) => sum + day.scans, 0);
  const avgDaily = (totalScans / analytics.timeline.length).toFixed(1);
  const peakDay = analytics.timeline.reduce((max, day) => day.scans > max.scans ? day : max, analytics.timeline[0]);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Scan Timeline Report</title>
      <style>
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; }
        }
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          color: #0F1A0F;
          line-height: 1.5;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #1E3020;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1E3020;
          font-size: 28px;
          margin: 0 0 5px 0;
        }
        .header p {
          color: #6B7C6B;
          margin: 0;
        }
        .summary-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-box {
          flex: 1;
          background: #F7FAF7;
          border: 1px solid #C8D8C8;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .summary-value {
          font-size: 32px;
          font-weight: bold;
          color: #1E3020;
          margin: 0 0 5px 0;
        }
        .summary-label {
          color: #6B7C6B;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1E3020;
          color: #fff;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #C8D8C8;
        }
        tr:nth-child(even) {
          background: #F7FAF7;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C8D8C8;
          font-size: 12px;
          color: #6B7C6B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SnapShroom Scan Timeline Report</h1>
        <p>Generated: ${now} | Prepared by: ${adminName}</p>
      </div>

      <div class="summary-stats">
        <div class="summary-box">
          <div class="summary-value">${totalScans.toLocaleString()}</div>
          <div class="summary-label">Total Scans (Period)</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${avgDaily}</div>
          <div class="summary-label">Average Daily Scans</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${peakDay.scans}</div>
          <div class="summary-label">Peak Day (${peakDay.date})</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${analytics.timeline.length}</div>
          <div class="summary-label">Days Tracked</div>
        </div>
      </div>

      <h2 style="color: #1E3020;">Daily Scan Activity</h2>
      <table>
        <tr>
          <th>Date</th>
          <th>Scan Count</th>
          <th>% of Total</th>
        </tr>
        ${analytics.timeline.map(day => `
          <tr>
            <td>${day.date}</td>
            <td>${day.scans.toLocaleString()}</td>
            <td>${((day.scans / totalScans) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>

      <div class="footer">
        <p>Confidential - SnapShroom Internal Report</p>
      </div>
    </body>
    </html>
  `;
};

const generateMostScannedHTML = (analytics: Analytics, adminName: string) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Most Scanned Mushrooms Report</title>
      <style>
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; }
        }
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          color: #0F1A0F;
          line-height: 1.5;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #1E3020;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1E3020;
          font-size: 28px;
          margin: 0 0 5px 0;
        }
        .header p {
          color: #6B7C6B;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1E3020;
          color: #fff;
          padding: 15px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 15px;
          border-bottom: 1px solid #C8D8C8;
        }
        .rank-1 td:first-child {
          font-weight: bold;
          color: #1E3020;
        }
        .medal {
          font-size: 20px;
        }
        tr:nth-child(even) {
          background: #F7FAF7;
        }
        .total-scans {
          margin-top: 20px;
          text-align: right;
          font-weight: bold;
          color: #1E3020;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C8D8C8;
          font-size: 12px;
          color: #6B7C6B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Most Scanned Mushrooms Report</h1>
        <p>Generated: ${now} | Prepared by: ${adminName}</p>
        <p>Total Scans Analyzed: ${analytics.mushrooms.total_scans.toLocaleString()}</p>
      </div>

      <table>
        <tr>
          <th>Rank</th>
          <th>Mushroom Name</th>
          <th>Scan Count</th>
          <th>Percentage</th>
        </tr>
        ${analytics.mushrooms.most_scanned_mushrooms.map((m, i) => `
          <tr class="rank-${i + 1}">
            <td><span class="medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.count.toLocaleString()}</td>
            <td>${((m.count / analytics.mushrooms.total_scans) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>

      <div class="total-scans">
        Total Unique Species: ${analytics.mushrooms.most_scanned_mushrooms.length}
      </div>

      <div class="footer">
        <p>Confidential - SnapShroom Internal Report</p>
      </div>
    </body>
    </html>
  `;
};

const generateTopLocationsHTML = (analytics: Analytics, adminName: string) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Top Scan Locations Report</title>
      <style>
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; }
        }
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          color: #0F1A0F;
          line-height: 1.5;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #1E3020;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1E3020;
          font-size: 28px;
          margin: 0 0 5px 0;
        }
        .header p {
          color: #6B7C6B;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1E3020;
          color: #fff;
          padding: 15px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 15px;
          border-bottom: 1px solid #C8D8C8;
        }
        tr:nth-child(even) {
          background: #F7FAF7;
        }
        .location-icon {
          color: #2BA8A0;
          font-size: 18px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C8D8C8;
          font-size: 12px;
          color: #6B7C6B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Top Scan Locations Report</h1>
        <p>Generated: ${now} | Prepared by: ${adminName}</p>
        <p>Total Scans: ${analytics.mushrooms.total_scans.toLocaleString()}</p>
      </div>

      <table>
        <tr>
          <th>Rank</th>
          <th>Location</th>
          <th>Scan Count</th>
          <th>Percentage</th>
          <th>Category</th>
        </tr>
        ${analytics.mushrooms.top_locations.map((loc, i) => {
          const percentage = (loc.count / analytics.mushrooms.total_scans) * 100;
          const category = percentage > 20 ? 'High Traffic' : percentage > 10 ? 'Medium Traffic' : 'Low Traffic';
          return `
            <tr>
              <td><strong>#${i + 1}</strong></td>
              <td>📍 ${loc.location}</td>
              <td>${loc.count.toLocaleString()}</td>
              <td>${percentage.toFixed(1)}%</td>
              <td>${category}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <div class="footer">
        <p>Confidential - SnapShroom Internal Report</p>
      </div>
    </body>
    </html>
  `;
};

const generateUserSummaryHTML = (users: User[], adminName: string) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const regularUsers = users.filter(u => u.role === 'user').length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>User Summary Report</title>
      <style>
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { print-color-adjust: exact; }
        }
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          color: #0F1A0F;
          line-height: 1.5;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #1E3020;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1E3020;
          font-size: 28px;
          margin: 0 0 5px 0;
        }
        .header p {
          color: #6B7C6B;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #F7FAF7;
          border: 1px solid #C8D8C8;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #1E3020;
          margin: 0 0 5px 0;
        }
        .stat-label {
          color: #6B7C6B;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1E3020;
          color: #fff;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #C8D8C8;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge-active {
          background: #D5F5E3;
          color: #1E8449;
        }
        .badge-inactive {
          background: #FADBD8;
          color: #C0392B;
        }
        .badge-admin {
          background: #6B7C61;
          color: #fff;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #C8D8C8;
          font-size: 12px;
          color: #6B7C6B;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SnapShroom User Summary Report</h1>
        <p>Generated: ${now} | Prepared by: ${adminName}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${users.length}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeUsers}</div>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${inactiveUsers}</div>
          <div class="stat-label">Inactive Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${adminUsers}</div>
          <div class="stat-label">Administrators</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${regularUsers}</div>
          <div class="stat-label">Regular Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${((activeUsers / users.length) * 100).toFixed(1)}%</div>
          <div class="stat-label">Activity Rate</div>
        </div>
      </div>

      <h2 style="color: #1E3020;">Recent Users (Last 5)</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
        </tr>
        ${[...users]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(u => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>@${u.username}</td>
              <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : ''}">${u.role}</span></td>
              <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
      </table>

      <div class="footer">
        <p>Confidential - SnapShroom Internal Report</p>
      </div>
    </body>
    </html>
  `;
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
              <SectionExportButton
                onPress={() => exportPDF(generateOverviewStatsHTML(analytics, user.name), 'Overview_Statistics.pdf')}
                label="Export Stats"
                icon="download-outline"
              />
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
                <SectionExportButton
                  onPress={() => exportPDF(generateScanTimelineHTML(analytics, user.name), 'Scan_Timeline.pdf')}
                  label="Export Timeline"
                  icon="download-outline"
                />
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
              <SectionExportButton
                onPress={() => {
                  const userStatusHtml = `
                    <html>
                      <head>
                        <style>
                          @media print { @page { size: A4; margin: 1.5cm; } }
                          body { font-family: Arial; padding: 20px; }
                          h1 { color: #1E3020; }
                          .stat-box { background: #F7FAF7; padding: 20px; margin: 10px 0; }
                        </style>
                      </head>
                      <body>
                        <h1>User Status Report</h1>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                        <div class="stat-box">
                          <h2>Active Users: ${analytics.users.active_users} (${((analytics.users.active_users / analytics.users.total_users) * 100).toFixed(1)}%)</h2>
                          <h2>Inactive Users: ${analytics.users.inactive_users} (${((analytics.users.inactive_users / analytics.users.total_users) * 100).toFixed(1)}%)</h2>
                          <h2>Admin Users: ${analytics.users.admin_count} (${((analytics.users.admin_count / analytics.users.total_users) * 100).toFixed(1)}%)</h2>
                          <h2>Total Users: ${analytics.users.total_users}</h2>
                        </div>
                      </body>
                    </html>
                  `;
                  exportPDF(userStatusHtml, 'User_Status.pdf');
                }}
                label="Export Status"
                icon="download-outline"
              />
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
              <SectionExportButton
                onPress={() => {
                  const quickInfoHtml = `
                    <html>
                      <head>
                        <style>
                          @media print { @page { size: A4; margin: 1.5cm; } }
                          body { font-family: Arial; padding: 20px; }
                        </style>
                      </head>
                      <body>
                        <h1>Quick Information Report</h1>
                        <p>Admin Count: ${analytics.users.admin_count}</p>
                        <p>Detection Success Rate: ${analytics.mushrooms.detection_success_rate}%</p>
                        <p>Edible Scans: ${analytics.mushrooms.edible_vs_toxic.edible}</p>
                        <p>Toxic Scans: ${analytics.mushrooms.edible_vs_toxic.toxic}</p>
                        <p>Unknown Scans: ${analytics.mushrooms.edible_vs_toxic.unknown}</p>
                      </body>
                    </html>
                  `;
                  exportPDF(quickInfoHtml, 'Quick_Info.pdf');
                }}
                label="Export Info"
                icon="download-outline"
              />
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
              <SectionExportButton
                onPress={() => exportPDF(generateUserSummaryHTML(users, user.name), 'User_Summary.pdf')}
                label="Export Summary"
                icon="download-outline"
                size="medium"
              />
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
              <SectionExportButton
                onPress={() => {
                  const userAnalyticsHtml = `
                    <html>
                      <head>
                        <style>
                          @media print { @page { size: A4; margin: 1.5cm; } }
                          body { font-family: Arial; padding: 20px; }
                        </style>
                      </head>
                      <body>
                        <h1>User Analytics Report</h1>
                        <p>Total Users: ${analytics.users.total_users}</p>
                        <p>Active Users: ${analytics.users.active_users}</p>
                        <p>Inactive Users: ${analytics.users.inactive_users}</p>
                        <p>Admin Users: ${analytics.users.admin_count}</p>
                        <p>Recent Registrations (30d): ${analytics.users.recent_registrations_30d}</p>
                        <p>Recent Logins (7d): ${analytics.users.recent_logins_7d}</p>
                      </body>
                    </html>
                  `;
                  exportPDF(userAnalyticsHtml, 'User_Analytics.pdf');
                }}
                label="Export User Stats"
                icon="download-outline"
              />
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
              <SectionExportButton
                onPress={() => {
                  const mushroomAnalyticsHtml = `
                    <html>
                      <head>
                        <style>
                          @media print { @page { size: A4; margin: 1.5cm; } }
                          body { font-family: Arial; padding: 20px; }
                        </style>
                      </head>
                      <body>
                        <h1>Mushroom Analytics Report</h1>
                        <p>Total Scans: ${analytics.mushrooms.total_scans}</p>
                        <p>Scans Last 30 Days: ${analytics.mushrooms.scans_last_30d}</p>
                        <p>Detection Success Rate: ${analytics.mushrooms.detection_success_rate}%</p>
                        <h2>Edibility Breakdown</h2>
                        <p>Edible: ${analytics.mushrooms.edible_vs_toxic.edible}</p>
                        <p>Toxic: ${analytics.mushrooms.edible_vs_toxic.toxic}</p>
                        <p>Unknown: ${analytics.mushrooms.edible_vs_toxic.unknown}</p>
                      </body>
                    </html>
                  `;
                  exportPDF(mushroomAnalyticsHtml, 'Mushroom_Analytics.pdf');
                }}
                label="Export Mushroom Stats"
                icon="download-outline"
              />
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
                <SectionExportButton
                  onPress={() => exportPDF(generateScanTimelineHTML(analytics, user.name), 'Analytics_Timeline.pdf')}
                  label="Export Timeline"
                  icon="download-outline"
                />
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
                <SectionExportButton
                  onPress={() => exportPDF(generateMostScannedHTML(analytics, user.name), 'Most_Scanned_Mushrooms.pdf')}
                  label="Export List"
                  icon="download-outline"
                />
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
                <SectionExportButton
                  onPress={() => exportPDF(generateTopLocationsHTML(analytics, user.name), 'Top_Locations.pdf')}
                  label="Export Locations"
                  icon="download-outline"
                />
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
            <SectionExportButton
              onPress={() => {
                const aboutHtml = `
                  <html>
                    <head>
                      <style>
                        @media print { @page { size: A4; margin: 1.5cm; } }
                        body { font-family: Arial; padding: 20px; }
                      </style>
                    </head>
                    <body>
                      <h1>SnapShroom Admin System</h1>
                      <p>Version: 1.0.0</p>
                      <h2>About This System</h2>
                      <p>SnapShroom is an advanced mushroom identification system that uses machine learning
                      to help users identify mushroom species, assess edibility, and learn about different
                      mushroom characteristics.</p>
                      
                      <h2>Admin Features</h2>
                      <ul>
                        <li>User management and role control</li>
                        <li>Analytics and insights dashboard</li>
                        <li>System monitoring and statistics</li>
                        <li>Account activation controls</li>
                        <li>Formal PDF report export (all sections)</li>
                      </ul>
                      
                      <h2>Contact & Support</h2>
                      <p>For technical support or questions about the admin panel, please contact the development team.</p>
                    </body>
                  </html>
                `;
                exportPDF(aboutHtml, 'System_About.pdf');
              }}
              label="Export Info"
              icon="download-outline"
            />
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
   STYLES
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