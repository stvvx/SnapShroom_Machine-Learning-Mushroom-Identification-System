import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';

// Mushroom data with Philippine coordinates
const MUSHROOM_LOCATIONS = [
  {
    id: 1,
    name: 'Wood Ear Mushroom',
    localName: 'Tainga ng Daga',
    region: 'Region 1',
    province: 'Pangasinan',
    lat: 15.8242,
    lng: 120.5724,
    edible: true,
    notes: 'Ear-shaped grows on dead wood - used in soups and stir-fry',
    capColor: 'dark brown',
  },
  {
    id: 2,
    name: 'White Oyster Mushroom',
    localName: 'Kabute',
    region: 'NCR',
    province: 'Manila',
    lat: 14.5995,
    lng: 120.9842,
    edible: true,
    notes: 'Most commonly cultivated mushroom in Philippines - sold in markets',
    capColor: 'white',
  },
  {
    id: 3,
    name: 'Enoki Mushroom',
    localName: 'Enoki',
    region: 'Region 2',
    province: 'Isabela',
    lat: 16.8129,
    lng: 121.7489,
    edible: true,
    notes: 'Long thin stems with tiny caps - grows in clusters - popular in Japanese dishes',
    capColor: 'white',
  },
  {
    id: 4,
    name: 'Shiitake Mushroom',
    localName: 'Shiitake',
    region: 'Region 4A',
    province: 'Cavite',
    lat: 14.3520,
    lng: 120.8981,
    edible: true,
    notes: 'Popular cultivated variety - brown umbrella-shaped cap with white scales',
    capColor: 'brown',
  },
  {
    id: 5,
    name: 'Death Cap',
    localName: 'Kabuting Nakamamatay',
    region: 'Region 4A',
    province: 'Cavite',
    lat: 14.3540,
    lng: 120.9020,
    edible: false,
    notes: '⚠️ EXTREMELY DEADLY - Contains amatoxins - Can be confused with edible mushrooms',
    capColor: 'greenish white',
  },
  {
    id: 6,
    name: 'False Morel',
    localName: 'Kabuting Utak',
    region: 'CAR',
    province: 'Benguet',
    lat: 16.4023,
    lng: 120.6026,
    edible: false,
    notes: '⚠️ DEADLY - Brain-like wrinkled cap - Contains gyromitrin',
    capColor: 'reddish brown',
  },
  {
    id: 7,
    name: 'Jack O Lantern Mushroom',
    localName: 'Kabuting Nagniningning',
    region: 'Region 4B',
    province: 'Quezon',
    lat: 14.8242,
    lng: 121.5041,
    edible: false,
    notes: '⚠️ POISONOUS - Bright orange color - Gills glow in the dark',
    capColor: 'orange',
  },
  {
    id: 8,
    name: 'Funeral Bell',
    localName: 'Kabuting Libing',
    region: 'Region 2',
    province: 'Isabela',
    lat: 16.8150,
    lng: 121.7510,
    edible: false,
    notes: '⚠️ EXTREMELY DEADLY - Small brown mushroom - Contains same toxins as Death Cap',
    capColor: 'brown',
  },
  {
    id: 9,
    name: 'Red Cage Fungus',
    localName: 'Kabuting Kulungan',
    region: 'Region 6',
    province: 'Iloilo',
    lat: 10.6918,
    lng: 122.5636,
    edible: false,
    notes: '⚠️ NOT EDIBLE - Bright red lattice structure - Foul odor attracts flies',
    capColor: 'red',
  },
  {
    id: 10,
    name: 'Button Mushroom',
    localName: 'Kabuting Paris',
    region: 'Northern Luzon',
    province: 'Rizal',
    lat: 14.5896,
    lng: 121.2050,
    edible: true,
    notes: 'Most commonly consumed mushroom globally; same species as cremini and portobello',
    capColor: 'white-light brown',
  },
];

// Web-only Leaflet Map Component
let LeafletMapComponent: any = null;

if (Platform.OS === 'web') {
  try {
    LeafletMapComponent = require('@/components/LeafletMap').default;
  } catch (e) {
    console.warn('LeafletMap component not available');
  }
}

export default function MapScreen() {
  const [selectedMushroom, setSelectedMushroom] = useState<typeof MUSHROOM_LOCATIONS[0] | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'chart'>('map');

  // Prepare data for Plotly
  const edibleCount = MUSHROOM_LOCATIONS.filter(m => m.edible).length;
  const poisonousCount = MUSHROOM_LOCATIONS.filter(m => !m.edible).length;

  // Data by region for bar chart
  const regionCounts = MUSHROOM_LOCATIONS.reduce((acc, mushroom) => {
    const region = mushroom.region;
    if (!acc[region]) acc[region] = { edible: 0, poisonous: 0 };
    if (mushroom.edible) acc[region].edible++;
    else acc[region].poisonous++;
    return acc;
  }, {} as Record<string, { edible: number; poisonous: number }>);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HamburgerMenu />
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
              
              {/* OpenStreetMap via Leaflet */}
              {Platform.OS === 'web' && LeafletMapComponent ? (
                <LeafletMapComponent 
                  mushrooms={MUSHROOM_LOCATIONS}
                  selectedMushroom={selectedMushroom}
                  onSelectMushroom={setSelectedMushroom}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <ThemedText>Map available on web platform</ThemedText>
                </View>
              )}

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

                  <View style={styles.detailRow}>
                    <Ionicons name="color-palette" size={18} color="#6B7C61" />
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Cap Color</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedMushroom.capColor}</ThemedText>
                    </View>
                  </View>

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
          <ThemedText style={styles.sectionTitle}>All Mushrooms</ThemedText>

          {MUSHROOM_LOCATIONS.map((mushroom) => (
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
  mapLoader: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  mapPlaceholder: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
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
});
