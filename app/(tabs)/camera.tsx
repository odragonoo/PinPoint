import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, TextInput, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storage } from '../../firebaseConfig'; // adjust path
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CameraTabScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);
  const router = useRouter();
  const [facing, setFacing] = useState<'front' | 'back'>('back');


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
      const photo = await cameraRef.current.takePictureAsync({ mirrorImage: false });
      setPhotoUri(photo.uri);

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

const handleSendPin = async () => {
  if (!photoUri) {
    alert('No photo captured');
    return;
  }

      console.log('Pin sent:', { photoUri, caption, locationName });
    // Placeholder action - send this to backend, etc.
    alert('Pin submitted!');
    setPhotoUri(null);
    setCaption('');
    setLocationName(null);

  const uploadImageToFirebase = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `images/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);

  try {
    const downloadURL = await uploadImageToFirebase(photoUri!);
    console.log('Image uploaded:', downloadURL);

    // Optionally save to Firestore:
    // await addDoc(collection(db, 'pins'), {
    //   imageUrl: downloadURL,
    //   caption,
    //   locationName,
    //   createdAt: new Date(),
    // });

    alert('Pin uploaded!');
    setPhotoUri(null);
    setCaption('');
    setLocationName(null);
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed');
  }


  return downloadURL;
};

  try {
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;

    // Navigate to map.tsx with photo URI and location
    router.push({
      pathname: '/map',
      params: {
        photoUri,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        caption,
        locationName: locationName || '',
      },
    });

    // Clear UI state
    setPhotoUri(null);
    setCaption('');
    setLocationName(null);
  } catch (err) {
    console.error('Failed to get location:', err);
    alert('Location error');
  }
};


  if (!permission) {
    return <View style={styles.container} />;
  }

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
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setPhotoUri(null)}>
            <Ionicons name="close" size={36} color="white" />
          </TouchableOpacity>

          {/* Location Label */}
          <View style={styles.locationLabel}>
            <Ionicons name="location-sharp" size={20} color="black" />
            <Text style={styles.locationText}>{locationName || 'Unknown Location'}</Text>
          </View>

          {/* Image Preview with background frame */}
          <View style={styles.imageCard}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          </View>

          {/* Caption Input */}
          <View style={styles.captionBox}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="#ccc"
              style={styles.captionInput}
            />
          </View>

          {/* Edit Tools */}
          <View style={styles.toolsRow}>
            {[
              // { label: 'Text', icon: 'text' },
              { label: 'Sticker', icon: 'image-outline' },
              { label: 'Overlay', icon: 'layers-outline' },
              { label: 'Edit', icon: 'settings-outline' },
              { label: 'Music', icon: 'musical-notes-outline' },
            ].map((tool, index) => (
              <View style={styles.toolItem} key={index}>
                <Ionicons name={tool.icon} size={22} color="white" />
                <Text style={styles.toolLabel}>{tool.label}</Text>
              </View>
            ))}
          </View>

          {/* Pin Button */}
          <TouchableOpacity style={styles.pinButton} onPress={handleSendPin}>
            <Text style={styles.pinButtonText}>Pin</Text>
            <Ionicons name="location" size={18} color="white" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </ScrollView>
      ) : (
<View style={styles.camera}>
  <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />


  {/* Top Buttons */}
  <View style={styles.topControls}>
    <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
      <Ionicons name="close" size={32} color="white" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.controlButton} onPress={() => {
      // toggle front/back camera
      setFacing(prev => (prev === 'back' ? 'front' : 'back'));
    }}>
      <Ionicons name="camera-reverse" size={32} color="white" />
    </TouchableOpacity>
  </View>

  {/* Shutter Button */}
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
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    position: 'relative',
  },
  shutterWrapper: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#000',
  },
  previewScreen: {
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 2,
  },
  locationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  locationText: {
    color: 'black',
    fontSize: 16,
    marginLeft: 6,
  },
  imageCard: {
    width: '90%',
    backgroundColor: '#8EDFD3',
    borderRadius: 20,
    padding: 10,
    marginVertical: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
  },
  captionBox: {
    width: '90%',
    backgroundColor: '#4C7D7E',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  captionInput: {
    color: 'white',
    fontSize: 16,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  toolItem: {
    alignItems: 'center',
  },
  toolLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  pinButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00AEEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topControls: {
  position: 'absolute',
  top: 40,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  zIndex: 10,
},
controlButton: {
  padding: 10,
},
});
