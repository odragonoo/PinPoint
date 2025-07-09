import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
  // Center the map on Georgia Tech
  const initialRegion = {
    latitude: 33.7756,
    longitude: -84.3963,
    latitudeDelta: 0.02, // Adjust for zoom level
    longitudeDelta: 0.02,
  };

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null} // Apple Maps on iOS
        initialRegion={initialRegion}
        showsUserLocation={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
