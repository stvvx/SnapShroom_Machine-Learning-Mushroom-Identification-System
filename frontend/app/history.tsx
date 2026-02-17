import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';

interface ScanRecord {
  _id: string;
  mushroom_detected: boolean;
  detection_confidence: number;
  mushroom_type: string | null;
  classification_confidence: number | null;
  edibility: string | null;
  image_url: string | null;
  location: {
    region?: string;
    province?: string;
    city?: string;
  } | null;
  created_at: string;
  success: boolean;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/toxicity/scans/history?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.scans) {
        setScans(data.scans);
      } else {
        throw new Error('Failed to fetch scan history');
      }
    } catch (err) {
      console.error('Error fetching scan history:', err);
      setError('Unable to load scan history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScanHistory();
  };

  const getEdibilityColor = (edibility: string | null) => {
    if (!edibility) return '#999';
    const lower = edibility.toLowerCase();
    if (lower.includes('safe') || lower.includes('edible')) return '#4CAF50';
    if (lower.includes('poison') || lower.includes('toxic') || lower.includes('deadly')) return '#D32F2F';
    return '#FF9800';
  };

  const getEdibilityIcon = (edibility: string | null) => {
    if (!edibility) return 'help-circle';
    const lower = edibility.toLowerCase();
    if (lower.includes('safe') || lower.includes('edible')) return 'checkmark-circle';
    if (lower.includes('poison') || lower.includes('toxic') || lower.includes('deadly')) return 'alert-circle';
    return 'warning';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderScanCard = (scan: ScanRecord) => {
    const edibilityColor = getEdibilityColor(scan.edibility);
    const edibilityIcon = getEdibilityIcon(scan.edibility);

    return (
      <TouchableOpacity
        key={scan._id}
        style={styles.scanCard}
        onPress={() => {
          if (scan.mushroom_type) {
            Alert.alert(
              scan.mushroom_type,
              `Confidence: ${((scan.classification_confidence || 0) * 100).toFixed(1)}%\n` +
              `Edibility: ${scan.edibility || 'Unknown'}\n` +
              `Location: ${scan.location?.region || 'Unknown'}`,
              [{ text: 'OK' }]
            );
          }
        }}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          {scan.image_url ? (
            <Image
              source={{ uri: scan.image_url }}
              style={styles.scanImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.scanImage, styles.noImagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color="#CCC" />
            </View>
          )}
          
          {/* Detection Badge */}
          <View style={[styles.detectionBadge, { backgroundColor: scan.mushroom_detected ? '#4CAF50' : '#D32F2F' }]}>
            <Ionicons name={scan.mushroom_detected ? 'checkmark' : 'close'} size={14} color="#FFF" />
          </View>
        </View>

        {/* Info */}
        <View style={styles.scanInfo}>
          <View style={styles.scanHeader}>
            <ThemedText style={styles.mushroomName}>
              {scan.mushroom_type || 'Unknown Mushroom'}
            </ThemedText>
            <ThemedText style={styles.scanDate}>
              {formatDate(scan.created_at)}
            </ThemedText>
          </View>

          {scan.mushroom_detected && scan.classification_confidence !== null && (
            <View style={styles.confidenceRow}>
              <Ionicons name="analytics" size={14} color="#666" />
              <ThemedText style={styles.confidenceText}>
                {(scan.classification_confidence * 100).toFixed(1)}% confidence
              </ThemedText>
            </View>
          )}

          <View style={styles.edibilityRow}>
            <Ionicons name={edibilityIcon} size={16} color={edibilityColor} />
            <ThemedText style={[styles.edibilityText, { color: edibilityColor }]}>
              {scan.edibility ? scan.edibility.charAt(0).toUpperCase() + scan.edibility.slice(1) : 'Unknown'}
            </ThemedText>
          </View>

          {scan.location?.region && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#999" />
              <ThemedText style={styles.locationText}>
                {scan.location.province || scan.location.region}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HamburgerMenu />
          <NotificationDropdown iconColor="#7BA05B" />
        </View>
        <ThemedText style={styles.headerTitle}>Scan History</ThemedText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Ionicons name="refresh" size={24} color="#7BA05B" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#7BA05B" />
          <ThemedText style={styles.loadingText}>Loading your scan history...</ThemedText>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#D32F2F" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchScanHistory}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && scans.length === 0 && (
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#CCC" />
          <ThemedText style={styles.emptyTitle}>No Scans Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Start scanning mushrooms to see your history here!
          </ThemedText>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push('/(tabs)/camera')}
          >
            <Ionicons name="camera" size={20} color="#FFF" />
            <ThemedText style={styles.scanButtonText}>Scan Mushroom</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan List */}
      {!loading && !error && scans.length > 0 && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#7BA05B']} />
          }
        >
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{scans.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Scans</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {scans.filter(s => s.mushroom_detected).length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Detected</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {scans.filter(s => s.edibility && s.edibility.toLowerCase().includes('safe')).length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Edible</ThemedText>
            </View>
          </View>

          {/* Scan Cards */}
          <View style={styles.scanList}>
            {scans.map(scan => renderScanCard(scan))}
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3E2D',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7BA05B',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3E2D',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7BA05B',
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7BA05B',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8E4DE',
    marginHorizontal: 12,
  },
  scanList: {
    gap: 12,
  },
  scanCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E4DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  scanImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F3EF',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mushroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2D',
    flex: 1,
    marginRight: 8,
  },
  scanDate: {
    fontSize: 11,
    color: '#999',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  edibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  edibilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#999',
  },
});
