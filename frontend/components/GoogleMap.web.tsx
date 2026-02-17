import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

// Web version using @react-google-maps/api
let GoogleMapComponent: any = null;

try {
  const { GoogleMap, LoadScript, Marker, InfoWindow } = require('@react-google-maps/api');
  
  const MapComponent = ({ mushrooms, selectedMushroom, onSelectMushroom }: any) => {
    const [selected, setSelected] = useState<any>(selectedMushroom);

    console.log('GoogleMap.web rendering with mushrooms:', mushrooms?.length, mushrooms);

    const mapContainerStyle = {
      width: '100%',
      height: '400px',
      borderRadius: '12px',
    };

    const center = {
      lat: 12.8797, // Center of Philippines
      lng: 121.7740,
    };

    const options = {
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    };

    const handleMarkerClick = (mushroom: any) => {
      setSelected(mushroom);
      onSelectMushroom(mushroom);
    };

    return (
      <LoadScript googleMapsApiKey="AIzaSyAQKuhDa1x_EaBHo2G18Xm4xJsAIK8QFDg">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={6}
          options={options}
        >
          {mushrooms.map((mushroom: any) => (
            <Marker
              key={mushroom.id}
              position={{ lat: mushroom.lat, lng: mushroom.lng }}
              onClick={() => handleMarkerClick(mushroom)}
              icon={{
                url: mushroom.edible 
                  ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                  : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => {
                setSelected(null);
                onSelectMushroom(null);
              }}
            >
              <View style={styles.infoWindow}>
                <ThemedText style={styles.infoTitle}>{selected.name}</ThemedText>
                <ThemedText style={styles.infoText}>{selected.localName}</ThemedText>
                <ThemedText style={styles.infoText}>
                  {selected.province}, {selected.region}
                </ThemedText>
                <ThemedText style={[
                  styles.infoStatus,
                  { color: selected.edible ? '#4CAF50' : '#D32F2F' }
                ]}>
                  {selected.edible ? '✅ Edible' : '⚠️ Poisonous'}
                </ThemedText>
              </View>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    );
  };

  GoogleMapComponent = MapComponent;
} catch (e) {
  console.warn('Google Maps component not available', e);
}

export default function GoogleMap(props: any) {
  if (GoogleMapComponent) {
    return <GoogleMapComponent {...props} />;
  } else {
    return (
      <View style={styles.placeholder}>
        <ThemedText>Map is loading...</ThemedText>
        <ThemedText style={styles.note}>
          Install @react-google-maps/api for interactive maps on web
        </ThemedText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  placeholder: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 20,
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  infoWindow: {
    padding: 8,
    maxWidth: 200,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  infoStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

