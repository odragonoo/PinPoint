// camera.tsx (with gallery access, map pin picking, and geocoding fix)

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePhotoStore } from '../../lib/PhotoContext';


export default function CameraTabScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFromGallery, setIsFromGallery] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const router = useRouter();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const { addPhoto } = usePhotoStore();
  const params = useLocalSearchParams();

  useEffect(() => {
  if (params.lat && params.lng) {
    const latitude = parseFloat(params.lat as string);
    const longitude = parseFloat(params.lng as string);

    setLocationCoords({ latitude, longitude });

    const getLocationName = async () => {
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = geo[0];
        const name = place?.name || place?.street || `${place.city}, ${place.region}`;
        setLocationName(name);
      } catch (err) {
        console.warn('Reverse geocode failed:', err.message);
        setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      }
    };

    getLocationName();
  }
}, [params.lat, params.lng]);


  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
      }
    })();
  }, []);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      setPhotoUri(photo.uri);
      setIsFromGallery(false);

      try {
        const loc = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync(loc.coords);
        if (geocode.length > 0) {
          const place = geocode[0];
          const name = place.name || place.street || `${place.city}, ${place.region}`;
          setLocationName(name);
        }
      } catch (err) {
        console.error('Error getting location name:', err);
      }
    }
  };

  const openImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setIsFromGallery(true);
      setLocationName(null);
      setLocationCoords(null);
    }
  };

  const handleSendPin = async () => {
    if (!photoUri) {
      alert('No photo captured');
      return;
    }

    try {
      const locToUse = locationCoords || (await Location.getCurrentPositionAsync()).coords;

      const photoEntry = {
        photoUri,
        caption,
        latitude: locToUse.latitude.toString(),
        longitude: locToUse.longitude.toString(),
        locationName: locationName || '',
      };

      addPhoto(photoEntry);

      alert('Pin submitted!');
      router.push('/map');

      setTimeout(() => {
        setPhotoUri(null);
        setCaption('');
        setLocationName(null);
        setLocationCoords(null);
        setIsFromGallery(false);
      }, 500);
    } catch (err) {
      console.error('Failed to get location:', err);
      alert('Location error');
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Camera permission is required.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: '#00AEEF' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <ScrollView contentContainerStyle={styles.previewScreen}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setPhotoUri(null)}>
            <Ionicons name="close" size={36} color="white" />
          </TouchableOpacity>

          {isFromGallery ? (
            <TouchableOpacity onPress={() => router.push('/map?mode=picker')} style={styles.locationLabel}>
              <Ionicons name="location-sharp" size={20} color="black" />
              <Text style={styles.locationText}>
                {locationName || 'Unknown Location (Tap to set)'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.locationLabel}>
              <Ionicons name="location-sharp" size={20} color="black" />
              <Text style={styles.locationText}>
                {locationName || 'Unknown Location'}
              </Text>
            </View>
          )}

          <LinearGradient
  colors={['#0D47A1', '#1976D2']}
  style={styles.imageCard}
>
  <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
</LinearGradient>


          <View style={styles.captionBox}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="#ccc"
              style={styles.captionInput}
            />
          </View>

          <View style={styles.toolsRow}>
  {[
    { label: 'Sticker', icon: 'images-outline' },
    { label: 'Overlay', icon: 'layers-outline' },
    { label: 'Edit', icon: 'settings-outline' },
    { label: 'Music', icon: 'musical-notes-outline' },
  ].map((tool, index) => (
    <TouchableOpacity style={styles.toolItem} key={index} onPress={() => alert(`${tool.label} pressed`)}>
      <Ionicons name={tool.icon} size={24} color="white" />
      <Text style={styles.toolLabel}>{tool.label}</Text>
    </TouchableOpacity>
  ))}
</View>


          <TouchableOpacity style={styles.pinButton} onPress={handleSendPin}>
            <Text style={styles.pinButtonText}>Pin</Text>
            <Ionicons name="location" size={18} color="white" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.camera}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}>
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.galleryButton} onPress={openImagePicker}>
            <Ionicons name="images-outline" size={32} color="white" />
          </TouchableOpacity>

          <View style={styles.shutterWrapper}>
            <TouchableOpacity style={styles.shutterButton} onPress={handleTakePicture}>
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1, position: 'relative' },
  shutterWrapper: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  shutterButton: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(0,0,0,0.2)',
  },
  shutterButtonInner: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', borderWidth: 2, borderColor: '#000',
  },
  previewScreen: { alignItems: 'center', backgroundColor: 'black', paddingVertical: 40 },
  closeButton: { position: 'absolute', top: 40, left: 20, zIndex: 2 },
  locationLabel: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10,
  },
  locationText: { color: 'black', fontSize: 16, marginLeft: 6 },
  imageCard: {
    width: '90%', aspectRatio: 3 / 4, backgroundColor: '#8EDFD3',
    borderRadius: 20, padding: 10, marginVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'contain' },
  captionBox: { width: '90%', backgroundColor: '#3e4444ff', borderRadius: 16, padding: 12, marginBottom: 20 },
  captionInput: { color: 'white', fontSize: 16 },
  toolsRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '100%',
  paddingHorizontal: 10,
  marginBottom: 30,
},

toolItem: {
  alignItems: 'center',
  justifyContent: 'center',
},

toolLabel: {
  color: 'white',
  fontSize: 12,
  marginTop: 4,
},

  pinButton: {
    position: 'absolute', bottom: 0, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#00AEEF', paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 24,
  },
  pinButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  topControls: {
    position: 'absolute', top: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10,
  },
  controlButton: { padding: 10 },
  galleryButton: {
    position: 'absolute', bottom: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 30, padding: 10, zIndex: 20,
  },
});
