import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';
import { API_URL } from '@/constants/api';
import GoogleMap from '@/components/GoogleMap';

// Coordinate mapping for mushroom species (database doesn't store coordinates)
const COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  'Wood Ear': { lat: 15.8242, lng: 120.5724 }, // Pangasinan
  'Oyster Mushroom': { lat: 14.5995, lng: 120.9842 }, // Manila
  'Enoki Mushroom': { lat: 16.8129, lng: 121.7489 }, // Isabela
  'Shiitake': { lat: 14.3520, lng: 120.8981 }, // Cavite
  'Death Cap': { lat: 14.3540, lng: 120.9020 }, // Cavite
  'False Morel': { lat: 16.4023, lng: 120.6026 }, // Benguet
  'Jack O Lantern': { lat: 14.8242, lng: 121.5041 }, // Quezon
  'Funeral Bell': { lat: 16.8150, lng: 121.7510 }, // Isabela
  'Red Cage': { lat: 10.6918, lng: 122.5636 }, // Iloilo
  'Button Mushroom': { lat: 14.5896, lng: 121.2050 }, // Rizal
};

interface MushroomLocation {
  id: string;
  name: string;
  localName: string;
  region: string;
  province: string;
  lat: number;
  lng: number;
  edible: boolean;
  notes: string;
  capColor: string;
  scientificName?: string;
  habitat?: string;
}

export default function MapScreen() {
  const [mushroomLocations, setMushroomLocations] = useState<MushroomLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMushroom, setSelectedMushroom] = useState<MushroomLocation | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'chart'>('map');

  // Fetch mushroom species from database
  useEffect(() => {
    fetchMushroomData();
  }, []);

  const fetchMushroomData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/species/all`);
      const data = await response.json();

      if (data.success && data.species) {
        // Transform database format to component format
        const transformedData: MushroomLocation[] = data.species.map((species: any) => {
          // Parse location string (e.g., "Region 2 – Isabela" or "NCR – Manila")
          const locationParts = species.location?.split('–') || ['Unknown', 'Unknown'];
          const region = locationParts[0]?.trim() || 'Unknown';
          const province = locationParts[1]?.trim() || 'Unknown';

          // Get coordinates from mapping or use default
          const coords = COORDINATES_MAP[species.english_name] || { lat: 14.5995, lng: 120.9842 };

          return {
            id: species._id || species.id,
            name: species.english_name || 'Unknown',
            localName: species.local_name || 'Unknown',
            region,
            province,
            lat: coords.lat,
            lng: coords.lng,
            edible: species.edible === true || species.edible === 'true',
            notes: species.notes || species.description || 'No information available',
            capColor: species.cap || 'Unknown',
            scientificName: species.scientific_name,
            habitat: species.habitat,
          };
        });

        setMushroomLocations(transformedData);
      } else {
        throw new Error('Failed to fetch mushroom data');
      }
    } catch (err) {
      console.error('Error fetching mushroom data:', err);
      setError('Unable to load mushroom data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare statistics data
  const edibleCount = mushroomLocations.filter(m => m.edible).length;
  const poisonousCount = mushroomLocations.filter(m => !m.edible).length;

  // Data by region for bar chart
  const regionCounts = mushroomLocations.reduce((acc, mushroom) => {
    const region = mushroom.region;
    if (!acc[region]) acc[region] = { edible: 0, poisonous: 0 };
    if (mushroom.edible) acc[region].edible++;
    else acc[region].poisonous++;
    return acc;
  }, {} as Record<string, { edible: number; poisonous: number }>);

  // Show loading state
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#7BA05B" />
        <ThemedText style={styles.loadingText}>Loading mushroom data...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#D32F2F" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMushroomData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerMenu />
          <NotificationDropdown iconColor="#7BA05B" />
        </View>
        <ThemedText style={styles.headerTitle}>Mushroom Map</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons name="map" size={18} color={viewMode === 'map' ? '#FFF' : '#999'} />
          <ThemedText style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'chart' && styles.toggleBtnActive]}
          onPress={() => setViewMode('chart')}
        >
          <Ionicons name="bar-chart" size={18} color={viewMode === 'chart' ? '#FFF' : '#999'} />
          <ThemedText style={[styles.toggleText, viewMode === 'chart' && styles.toggleTextActive]}>Stats</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {viewMode === 'map' ? (
          // MAP VIEW
          <>
            <View style={styles.mapSection}>
              <ThemedText style={styles.sectionTitle}>Philippine Mushroom Locations</ThemedText>
              
              {/* Google Maps - Auto selects web/native version */}
              <GoogleMap 
                mushrooms={mushroomLocations}
                selectedMushroom={selectedMushroom}
                onSelectMushroom={setSelectedMushroom}
              />

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#7BA05B' }]} />
                  <ThemedText style={styles.legendText}>Edible ({edibleCount})</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#D32F2F' }]} />
                  <ThemedText style={styles.legendText}>Poisonous ({poisonousCount})</ThemedText>
                </View>
              </View>
            </View>

            {/* Mushroom Details */}
            {selectedMushroom && (
              <View style={styles.detailsSection}>
                <View style={styles.detailsHeader}>
                  <ThemedText style={styles.detailsTitle}>{selectedMushroom.name}</ThemedText>
                  <TouchableOpacity onPress={() => setSelectedMushroom(null)}>
                    <Ionicons name="close" size={24} color="#2D3E2D" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="language" size={18} color="#6B7C61" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Local Name</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedMushroom.localName}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="map" size={18} color="#6B7C61" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Location</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedMushroom.province}, {selectedMushroom.region}
                      </ThemedText>
                    </View>
                  </View>

                  {selectedMushroom.scientificName && (
                    <View style={styles.detailRow}>
                      <Ionicons name="flask" size={18} color="#6B7C61" />
                      <View style={styles.detailContent}>
                        <ThemedText style={styles.detailLabel}>Scientific Name</ThemedText>
                        <ThemedText style={[styles.detailValue, { fontStyle: 'italic' }]}>{selectedMushroom.scientificName}</ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Ionicons name="color-palette" size={18} color="#6B7C61" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Cap Description</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedMushroom.capColor}</ThemedText>
                    </View>
                  </View>

                  {selectedMushroom.habitat && (
                    <View style={styles.detailRow}>
                      <Ionicons name="leaf" size={18} color="#6B7C61" />
                      <View style={styles.detailContent}>
                        <ThemedText style={styles.detailLabel}>Habitat</ThemedText>
                        <ThemedText style={styles.detailValue}>{selectedMushroom.habitat}</ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Ionicons name={selectedMushroom.edible ? 'checkmark-circle' : 'alert-circle'} size={18} color={selectedMushroom.edible ? '#4CAF50' : '#D32F2F'} />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Status</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: selectedMushroom.edible ? '#4CAF50' : '#D32F2F' }]}>
                        {selectedMushroom.edible ? '✅ Edible' : '⚠️ Poisonous/Not Edible'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.notesSection}>
                    <ThemedText style={styles.notesTitle}>📝 Notes</ThemedText>
                    <ThemedText style={styles.notesText}>{selectedMushroom.notes}</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          // STATS VIEW
          <View style={styles.statsSection}>
            <ThemedText style={styles.sectionTitle}>Mushroom Statistics</ThemedText>

            {/* Summary Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#7BA05B' }]}>
                <Ionicons name="checkmark-circle" size={32} color="#7BA05B" />
                <ThemedText style={styles.statNumber}>{edibleCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Edible Species</ThemedText>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#D32F2F' }]}>
                <Ionicons name="alert-circle" size={32} color="#D32F2F" />
                <ThemedText style={styles.statNumber}>{poisonousCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Poisonous Species</ThemedText>
              </View>
            </View>

            {/* Distribution by Region */}
            <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>Distribution by Region</ThemedText>
            {Object.entries(regionCounts).map(([region, counts]) => (
              <View key={region} style={styles.regionCard}>
                <ThemedText style={styles.regionName}>{region}</ThemedText>
                <View style={styles.regionBars}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${(counts.edible / 10) * 100}%`, backgroundColor: '#7BA05B' }]} />
                    <ThemedText style={styles.barLabel}>✅ {counts.edible}</ThemedText>
                  </View>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${(counts.poisonous / 10) * 100}%`, backgroundColor: '#D32F2F' }]} />
                    <ThemedText style={styles.barLabel}>⚠️ {counts.poisonous}</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Mushroom List */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>All Mushrooms ({mushroomLocations.length})</ThemedText>

          {mushroomLocations.map((mushroom) => (
            <TouchableOpacity
              key={mushroom.id}
              style={[
                styles.listItem,
                selectedMushroom?.id === mushroom.id && styles.listItemSelected,
              ]}
              onPress={() => setSelectedMushroom(mushroom)}
            >
              <View
                style={[
                  styles.listItemDot,
                  { backgroundColor: mushroom.edible ? '#7BA05B' : '#D32F2F' },
                ]}
              />
              <View style={styles.listItemContent}>
                <ThemedText style={styles.listItemName}>{mushroom.name}</ThemedText>
                <ThemedText style={styles.listItemLocation}>
                  {mushroom.province} • {mushroom.region}
                </ThemedText>
              </View>
              <Ionicons
                name={mushroom.edible ? 'checkmark' : 'warning'}
                size={20}
                color={mushroom.edible ? '#4CAF50' : '#D32F2F'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3E2D',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#7BA05B',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  mapSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3E2D',
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F3EF',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  detailCard: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3E2D',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E4DE',
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3E2D',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  regionCard: {
    padding: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    marginBottom: 8,
  },
  regionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3E2D',
    marginBottom: 8,
  },
  regionBars: {
    gap: 8,
  },
  barContainer: {
    gap: 4,
  },
  bar: {
    height: 20,
    borderRadius: 4,
    minWidth: 20,
  },
  barLabel: {
    fontSize: 11,
    color: '#666',
  },
  listSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  listItemSelected: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#7BA05B',
  },
  listItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  listItemLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  centerContent: {
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
});