import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { ThemedText } from './themed-text';

// Native version (iOS/Android) using react-native-maps
export default function GoogleMap({ mushrooms, selectedMushroom, onSelectMushroom }: any) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 12.8797,
        longitude: 121.7740,
        latitudeDelta: 8,
        longitudeDelta: 8,
      }}
    >
      {mushrooms.map((mushroom: any) => (
        <Marker
          key={mushroom.id}
          coordinate={{ latitude: mushroom.lat, longitude: mushroom.lng }}
          pinColor={mushroom.edible ? '#4CAF50' : '#D32F2F'}
          onPress={() => onSelectMushroom(mushroom)}
        >
          <Callout>
            <View style={styles.callout}>
              <ThemedText style={styles.calloutTitle}>{mushroom.name}</ThemedText>
              <ThemedText>{mushroom.localName}</ThemedText>
              <ThemedText>{mushroom.province}</ThemedText>
              <ThemedText style={{ color: mushroom.edible ? '#4CAF50' : '#D32F2F' }}>
                {mushroom.edible ? 'Edible' : 'Poisonous'}
              </ThemedText>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
});