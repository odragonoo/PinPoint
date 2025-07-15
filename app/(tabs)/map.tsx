import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import {Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';

export default function MapScreen() {
  const { photoUri, latitude, longitude, caption, locationName } = useLocalSearchParams();

  const [modalVisible, setModalVisible] = useState(false);

  const parsedLat = parseFloat(latitude as string);
  const parsedLon = parseFloat(longitude as string);

  const region = {
    latitude: parsedLat || 33.7756,
    longitude: parsedLon || -84.3963,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
      >
        {photoUri && latitude && longitude && (
          <Marker coordinate={{ latitude: parsedLat, longitude: parsedLon }}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image source={{ uri: photoUri as string }} style={styles.markerImage} />
            </TouchableOpacity>
          </Marker>
        )}
      </MapView>

      {/* Modal showing full image and details */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            {/* 🟡 Location Name at the Top */}
            {locationName ? (
              <Text style={styles.locationName}>{locationName}</Text>
            ) : null}

            {/* Image */}
            <Image source={{ uri: photoUri as string }} style={styles.fullImage} />

            {/* Caption */}
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}

            {/* Close Button */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  markerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#8EDFD3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  fullImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
  },
  caption: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
