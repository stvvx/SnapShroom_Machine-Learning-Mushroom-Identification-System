import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from './themed-text';

// Web version using Google Maps iframe or Leaflet
export default function GoogleMap({ mushrooms, selectedMushroom, onSelectMushroom }: any) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Create markers query string for Google Maps Static API
  const createMarkersParam = () => {
    return mushrooms.map((m: any) => {
      const color = m.edible ? 'green' : 'red';
      return `color:${color}|${m.lat},${m.lng}`;
    }).join('&markers=');
  };

  // Center of Philippines
  const center = '12.8797,121.7740';
  const zoom = 6;
  
  // Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyAQKuhDa1x_EaBHo2G18Xm4xJsAIK8QFDg&center=${center}&zoom=${zoom}&maptype=roadmap`;

  return (
    <View style={styles.container}>
      {!mapLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7BA05B" />
          <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
        </View>
      )}
      <iframe
        src={mapUrl}
        style={{
          width: '100%',
          height: '400px',
          border: 0,
          borderRadius: '12px',
          display: mapLoaded ? 'block' : 'none'
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      
      {/* Markers info below map */}
      <View style={styles.markersList}>
        {mushrooms.slice(0, 3).map((mushroom: any) => (
          <View key={mushroom.id} style={styles.markerItem}>
            <View style={[
              styles.markerDot, 
              { backgroundColor: mushroom.edible ? '#4CAF50' : '#D32F2F' }
            ]} />
            <ThemedText style={styles.markerText}>{mushroom.name}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  markersList: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markerText: {
    fontSize: 12,
    color: '#666',
  },
});
