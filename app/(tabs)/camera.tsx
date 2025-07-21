// camera.tsx (with gallery access, map pin picking, and geocoding fix)

import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera'; // Added CameraType and Camera alias
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'; // Added Alert, Platform
import { usePhotoStore } from '../../lib/PhotoContext'; // Assuming this path is correct

export default function CameraTabScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFromGallery, setIsFromGallery] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false); // New state for location permission

  // Correctly type the cameraRef
  const cameraRef = useRef<ExpoCamera>(null); // Use ExpoCamera for the ref type
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back'); // Use CameraType from expo-camera
  const { addPhoto } = usePhotoStore();
  const params = useLocalSearchParams();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Unified useEffect for permissions and profile picture
  useEffect(() => {
    const requestPermissionsAndFetchProfile = async () => {
      // Request camera permission
      if (!cameraPermission?.granted) {
        const { status } = await requestCameraPermission();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Camera permission is needed to take photos.');
        }
      }

      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        setLocationPermissionGranted(true);
      } else {
        console.warn('Location permission not granted. Some features might be limited.');
        Alert.alert('Permission required', 'Location permission is recommended for geotagging photos.');
      }

      // Fetch user profile picture
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setProfilePicture(userData.avatar || null); // Assuming 'avatar' field in user document
        } else {
          console.warn('User document not found for fetching profile picture.');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    requestPermissionsAndFetchProfile();
  }, []); // Empty dependency array means this runs once on component mount

  // Effect for handling map pin picking (params)
  useEffect(() => {
    if (params.lat && params.lng) {
      const latitude = parseFloat(params.lat as string);
      const longitude = parseFloat(params.lng as string);

      if (!isNaN(latitude) && !isNaN(longitude)) { // Ensure parsed values are valid numbers
        setLocationCoords({ latitude, longitude });

        const getLocationName = async () => {
          if (!locationPermissionGranted) {
            console.warn('Location permission not granted, cannot reverse geocode.');
            setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            return;
          }
          try {
            const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
            const place = geo[0];
            const name = place?.name || place?.street || (place.city && place.region ? `${place.city}, ${place.region}` : null) || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            setLocationName(name);
          } catch (err: any) { // Type the error as 'any' for now, or a more specific error type
            console.warn('Reverse geocode failed:', err.message);
            setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          }
        };
        getLocationName();
      } else {
        console.warn('Invalid latitude or longitude received from params.');
      }
    }
  }, [params.lat, params.lng, locationPermissionGranted]); // Depend on locationPermissionGranted

  async function uploadImageToCloudinary(uri: string): Promise<string | null> {
    const data = new FormData();
    data.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`, // Unique name for better caching
    } as any); // `as any` is often needed for FormData with file objects in React Native
    data.append('upload_preset', 'PinPoint'); // Your actual preset

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dsgvp6swh/image/upload',
        {
          method: 'POST',
          body: data,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data', // Explicitly set content type
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        return result.secure_url; // uploaded image URL
      } else {
        console.error('Cloudinary upload error:', result);
        // Alert the user about upload failure
        Alert.alert('Upload Failed', result.error?.message || 'Failed to upload image to Cloudinary.');
        return null;
      }
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      Alert.alert('Upload Failed', 'Network error or Cloudinary service issue.');
      return null;
    }
  }

  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      setPhotoUri(photo.uri);
      setIsFromGallery(false);
      setLocationCoords(null); // Clear previous map-picked location for new photo

      if (locationPermissionGranted) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const geocode = await Location.reverseGeocodeAsync(loc.coords);
          if (geocode.length > 0) {
            const place = geocode[0];
            const name = place?.name || place?.street || (place.city && place.region ? `${place.city}, ${place.region}` : null) || 'Unknown Nearby Location';
            setLocationName(name);
            setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          } else {
            setLocationName('Could not determine location name.');
            setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        } catch (err: any) {
          console.error('Error getting photo location or reverse geocoding:', err);
          setLocationName('Location unavailable.');
          // Still try to get coords if location permission is there, even if geocoding fails
          try {
             const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
             setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          } catch (coordErr) {
             console.error('Could not get coordinates either:', coordErr);
             setLocationCoords(null);
          }
        }
      } else {
        Alert.alert('Location Permission', 'Grant location permission to automatically tag photos with your current location.');
        setLocationName('Location permission not granted.');
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
    }
  };

  const openImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access gallery is required to pick images.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        // Allows editing, might be useful if you want to crop/resize before sending
        // allowsEditing: true,
        // aspect: [4, 3], // Example aspect ratio
      });

      if (!result.canceled && result.assets?.length > 0) {
        setPhotoUri(result.assets[0].uri);
        setIsFromGallery(true);
        setLocationName(null); // Clear location when picking from gallery
        setLocationCoords(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
    }
  };

  const handleSendPin = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Not Logged In', 'You must be logged in to send a pin.');
      router.push('/login'); // Assuming you have a login route
      return;
    }

    if (!photoUri) {
      Alert.alert('No Photo', 'Please capture or select a photo first.');
      return;
    }

    try {
      const uploadedUrl = await uploadImageToCloudinary(photoUri);
      if (!uploadedUrl) {
        // Error already alerted by uploadImageToCloudinary
        return;
      }

      let finalLocationCoords = locationCoords;
      if (!finalLocationCoords && locationPermissionGranted) {
        // Try to get current location if no location was picked/set and permission is granted
        try {
          const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          finalLocationCoords = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
        } catch (err) {
          console.warn('Could not get current location for pin:', err);
        }
      }

      if (!finalLocationCoords) {
         Alert.alert('Location Missing', 'Location information is required for the pin. Please enable location or pick a location from the map.');
         return;
      }

      const pinData = {
        imageUrl: uploadedUrl,
        caption: caption || '', // Ensure caption is never undefined
        locationName: locationName || `Lat: ${finalLocationCoords.latitude.toFixed(4)}, Lng: ${finalLocationCoords.longitude.toFixed(4)}`,
        latitude: finalLocationCoords.latitude, // Store as number
        longitude: finalLocationCoords.longitude, // Store as number
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email || 'Anonymous', // Fallback for username
        createdAt: new Date(),
        profilePicture: profilePicture || '', // Include fetched profile picture
      };

      await addDoc(collection(db, 'photos'), pinData);
      console.log('Pin submitted successfully:', pinData);
      Alert.alert('Success', 'Pin submitted!');

      // Reset state and navigate
      setPhotoUri(null);
      setCaption('');
      setLocationName(null);
      setLocationCoords(null);
      setIsFromGallery(false);
      router.push('/'); // Navigate back to home/feed

    } catch (err) {
      console.error('Failed to send pin:', err);
      Alert.alert('Error', 'Failed to submit pin. Please check your network connection and try again.');
    }
  };

  // Permission check for CameraView
  if (!cameraPermission) {
    return <View style={styles.container} />; // Or a loading indicator
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>
          We need your permission to show the camera.
        </Text>
        <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
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

          {/* Location display, now dynamically showing "Tap to set" only if from gallery */}
          <TouchableOpacity
            onPress={() => isFromGallery && router.push('/?mode=picker')}
            style={styles.locationLabel}
            disabled={!isFromGallery} // Disable touch if not from gallery (i.e., photo taken)
          >
            <Ionicons name="location-sharp" size={20} color="black" />
            <Text style={styles.locationText}>
              {locationName || (isFromGallery ? 'Tap to set location' : 'Retrieving location...')}
            </Text>
          </TouchableOpacity>

          {profilePicture && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image
                source={{ uri: profilePicture }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
              />
              <Text style={{ color: 'white', fontSize: 16 }}>
                {auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous'}
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
              multiline
            />
          </View>

          <View style={styles.toolsRow}>
            {[
              { label: 'Sticker', icon: 'images-outline' },
              { label: 'Overlay', icon: 'layers-outline' },
              { label: 'Edit', icon: 'settings-outline' },
              { label: 'Music', icon: 'musical-notes-outline' },
            ].map((tool, index) => (
              <TouchableOpacity style={styles.toolItem} key={index} onPress={() => Alert.alert(`${tool.label}`, `${tool.label} feature coming soon!`)}>
                <Ionicons name={tool.icon as any} size={24} color="white" /> {/* Cast as any for now, or use specific icon names */}
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
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: '#00AEEF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: { flex: 1, position: 'relative', width: '100%', height: '100%' }, // Ensure camera fills container
  shutterWrapper: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  shutterButton: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(0,0,0,0.2)',
  },
  shutterButtonInner: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', borderWidth: 2, borderColor: '#000',
  },
  previewScreen: {
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 40,
    width: '100%', // Ensure ScrollView content takes full width
  },
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
    // Corrected to use a container for absolute positioning within ScrollView content
    // Or you might want this to be fixed at the bottom of the screen regardless of scroll
    // If you want it fixed, it should be outside the ScrollView
    position: 'absolute', bottom: 20, right: 20, // Adjust bottom as needed for ScrollView
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#00AEEF', paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 24,
    zIndex: 10, // Ensure it's above other elements
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

