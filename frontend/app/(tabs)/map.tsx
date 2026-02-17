import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';
import { API_URL } from '@/constants/api';
import GoogleMap from '@/components/GoogleMap';

// Mushroom image mapping (placeholder for now - replace with actual images)
const MUSHROOM_IMAGES: Record<string, any> = {
  'Oyster Mushroom': require('@/assets/images/react-logo.png'), // Replace with actual image
  'Enoki Mushroom': require('@/assets/images/react-logo.png'),
  'Button Mushroom': require('@/assets/images/react-logo.png'),
  'Shiitake': require('@/assets/images/react-logo.png'),
  'Wood Ear': require('@/assets/images/react-logo.png'),
  'Death Cap': require('@/assets/images/react-logo.png'),
  'False Morel': require('@/assets/images/react-logo.png'),
  'Jack O Lantern': require('@/assets/images/react-logo.png'),
  'Funeral Bell': require('@/assets/images/react-logo.png'),
  'Red Cage': require('@/assets/images/react-logo.png'),
};

// Coordinate mapping for Philippine regions/provinces from database location field
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // NCR
  'NCR – Manila': { lat: 14.5995, lng: 120.9842 },
  'NCR – Quezon City': { lat: 14.6760, lng: 121.0437 },
  'NCR – Makati': { lat: 14.5547, lng: 121.0244 },
  
  // Luzon Regions
  'CAR – Benguet': { lat: 16.4023, lng: 120.6026 },
  'CAR – Baguio': { lat: 16.4023, lng: 120.5960 },
  'Region 1 – Pangasinan': { lat: 15.8949, lng: 120.2863 },
  'Region 1 – La Union': { lat: 16.6159, lng: 120.3209 },
  'Region 2 – Isabela': { lat: 16.9754, lng: 121.8107 },
  'Region 2 – Cagayan': { lat: 18.2490, lng: 121.8870 },
  'Region 3 – Bulacan': { lat: 14.7942, lng: 120.8799 },
  'Region 3 – Pampanga': { lat: 15.0794, lng: 120.6200 },
  'Region 4A – Cavite': { lat: 14.4791, lng: 120.8970 },
  'Region 4A – Laguna': { lat: 14.2691, lng: 121.4113 },
  'Region 4A – Batangas': { lat: 13.7565, lng: 121.0583 },
  'Region 4A – Rizal': { lat: 14.6037, lng: 121.3084 },
  'Region 4A – Quezon': { lat: 14.0223, lng: 122.1215 },
  'Region 4B – Mindoro': { lat: 13.1000, lng: 121.0000 },
  'Region 5 – Albay': { lat: 13.1391, lng: 123.7377 },
  'Region 5 – Camarines Sur': { lat: 13.5291, lng: 123.3483 },
  
  // Visayas Regions
  'Region 6 – Iloilo': { lat: 10.7202, lng: 122.5621 },
  'Region 6 – Negros Occidental': { lat: 10.6710, lng: 122.9539 },
  'Region 6 – Aklan': { lat: 11.9204, lng: 122.0107 },
  'Region 7 – Cebu': { lat: 10.3157, lng: 123.8854 },
  'Region 7 – Bohol': { lat: 9.8500, lng: 124.1435 },
  'Region 8 – Leyte': { lat: 11.2500, lng: 124.8333 },
  'Region 8 – Samar': { lat: 11.5804, lng: 125.0300 },
  
  // Mindanao Regions
  'Region 9 – Zamboanga': { lat: 6.9214, lng: 122.0790 },
  'Region 10 – Bukidnon': { lat: 8.0542, lng: 124.9292 },
  'Region 10 – Misamis Oriental': { lat: 8.5050, lng: 124.6450 },
  'Region 11 – Davao': { lat: 7.1907, lng: 125.4553 },
  'Region 12 – South Cotabato': { lat: 6.3333, lng: 124.8333 },
  'BARMM – Maguindanao': { lat: 6.9414, lng: 124.4111 },
  'CARAGA – Agusan del Norte': { lat: 8.9472, lng: 125.5281 },
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
          // Handle both en dash (–) and regular hyphen (-)
          const locationParts = species.location?.split(/[–-]/) || ['Unknown', 'Unknown'];
          const region = locationParts[0]?.trim() || 'Unknown';
          const province = locationParts[1]?.trim() || 'Unknown';

          // Normalize location key by replacing hyphens with en dashes for lookup
          const locationKey = (species.location || 'NCR – Manila').replace(/-/g, '–');
          const coords = LOCATION_COORDINATES[locationKey] || { lat: 14.5995, lng: 120.9842 }; // Default to Manila

          console.log(`${species.english_name}: location="${species.location}" normalized="${locationKey}" -> lat:${coords.lat}, lng:${coords.lng}`);

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

        {/* Mushroom Gallery/About Section */}
        <View style={styles.gallerySection}>
          <ThemedText style={styles.sectionTitle}>Philippine Mushroom Species ({mushroomLocations.length})</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Comprehensive guide to edible and poisonous mushrooms found across the Philippines
          </ThemedText>

          <View style={styles.galleryGrid}>
            {mushroomLocations.map((mushroom) => (
              <TouchableOpacity
                key={mushroom.id}
                style={[
                  styles.galleryCard,
                  selectedMushroom?.id === mushroom.id && styles.galleryCardSelected,
                ]}
                onPress={() => setSelectedMushroom(mushroom)}
                activeOpacity={0.7}
              >
                {/* Mushroom Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={MUSHROOM_IMAGES[mushroom.name] || require('@/assets/images/react-logo.png')}
                    style={styles.mushroomImage}
                    resizeMode="cover"
                  />
                  <View style={[
                    styles.edibilityBadge,
                    { backgroundColor: mushroom.edible ? '#4CAF50' : '#D32F2F' }
                  ]}>
                    <Ionicons
                      name={mushroom.edible ? 'checkmark-circle' : 'alert-circle'}
                      size={12}
                      color="#FFF"
                    />
                    <Text style={styles.badgeText}>
                      {mushroom.edible ? 'Edible' : 'Toxic'}
                    </Text>
                  </View>
                </View>

                {/* Mushroom Info */}
                <View style={styles.cardContent}>
                  <ThemedText style={styles.cardTitle} numberOfLines={1}>{mushroom.name}</ThemedText>
                  <ThemedText style={styles.cardLocalName} numberOfLines={1}>({mushroom.localName})</ThemedText>
                  
                  {mushroom.scientificName && (
                    <ThemedText style={styles.cardScientific} numberOfLines={1}>
                      <Text style={{ fontStyle: 'italic' }}>{mushroom.scientificName}</Text>
                    </ThemedText>
                  )}

                  <View style={styles.cardInfoRow}>
                    <Ionicons name="location" size={12} color="#7BA05B" />
                    <ThemedText style={styles.cardInfoText} numberOfLines={1}>
                      {mushroom.province}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setSelectedMushroom(mushroom)}
                  >
                    <ThemedText style={styles.viewMoreText}>View Details</ThemedText>
                    <Ionicons name="arrow-forward" size={12} color="#7BA05B" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  gallerySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  galleryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '48%',
    marginBottom: 4,
  },
  galleryCardSelected: {
    borderColor: '#7BA05B',
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F3EF',
    position: 'relative',
  },
  mushroomImage: {
    width: '100%',
    height: '100%',
  },
  edibilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 2,
  },
  cardLocalName: {
    fontSize: 11,
    color: '#7BA05B',
    fontWeight: '500',
    marginBottom: 6,
  },
  cardScientific: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardInfoText: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  cardNotes: {
    fontSize: 11,
    color: '#555',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 6,
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7BA05B',
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