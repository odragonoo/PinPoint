import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePhotoStore } from '../../lib/PhotoContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MapScreen() {
  const { photos } = usePhotoStore();
  const mapRef = useRef<MapView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const isPickerMode = params?.mode === 'picker';

  const groupedByLocation = photos.reduce((acc: any, photo: any) => {
    const lat = parseFloat(photo.latitude);
    const lon = parseFloat(photo.longitude);
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;
    const key = `${roundedLat},${roundedLon}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  const firstPhoto = photos[0];
  const region = {
    latitude: firstPhoto ? parseFloat(firstPhoto.latitude) : 33.7756,
    longitude: firstPhoto ? parseFloat(firstPhoto.longitude) : -84.3963,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onPress={(e) => {
          if (isPickerMode) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            router.push({
              pathname: '/camera',
              params: {
                lat: latitude.toString(),
                lng: longitude.toString(),
              },
            });
          }
        }}
      >
        {!isPickerMode &&
          Object.entries(groupedByLocation).map(([key, group], index) => {
            const [lat, lon] = key.split(',').map(Number);
            return (
              <Marker key={index} coordinate={{ latitude: lat, longitude: lon }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPhotos(group);
                    setModalVisible(true);
                    mapRef.current?.animateToRegion({
                      latitude: lat,
                      longitude: lon,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }, 500);
                  }}
                >
                  <View style={styles.markerWrapper}>
                    <Image source={{ uri: group[0].photoUri }} style={styles.markerImage} />
                    {group.length > 1 && (
                      <View style={styles.photoCountBadge}>
                        <Text style={styles.photoCountText}>{group.length}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Marker>
            );
          })}
      </MapView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            {selectedPhotos.length > 0 && (
              <>
                <Text style={styles.locationName}>{selectedPhotos[0].locationName}</Text>
                <ScrollView
                  horizontal
                  pagingEnabled
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ alignItems: 'center' }}
                  style={{ width: SCREEN_WIDTH * 0.9 }}
                >
                  {selectedPhotos.map((photo, idx) => (
                    <View key={idx} style={styles.carouselItem}>
                      <Image source={{ uri: photo.photoUri }} style={styles.fullImage} />
                      {photo.caption ? (
                        <Text style={styles.caption}>{photo.caption}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
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
    width: SCREEN_WIDTH * 0.9,
    maxHeight: '80%',
    backgroundColor: '#8EDFD3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  carouselItem: {
    width: SCREEN_WIDTH * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: 250,
    height: 330,
    borderRadius: 10,
    marginBottom: 10,
  },
  caption: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  markerWrapper: {
    position: 'relative',
  },
  photoCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
