import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CameraView, useCameraPermissions, useCameraDevice, Camera } from 'expo-camera';
import * as Location from 'expo-location';

import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraTabScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);

  const handleSend = () => {
  console.log('Send button pressed');
  alert('Photo sent! (simulation)');
};

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
    })();
  }, []);

  // Show loading if no camera permission info yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Ask for permission if not granted
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ThemedText type="title" style={styles.permissionText}>
          Camera access is required
        </ThemedText>
        <ThemedText style={styles.permissionSubText}>
          Please grant permission to use the camera to take photos and videos.
        </ThemedText>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        mirrorImage: false,
      });
      setPhotoUri(photo.uri);

      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (err) {
        console.error('Error getting location:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.container}>

          <Image source={{ uri: photoUri }} style={styles.fullScreenImage} resizeMode="cover" />
          <TouchableOpacity style={styles.closePreviewButton} onPress={() => {
            setPhotoUri(null);
            setLocation(null);
          }}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          {/* Show location */}
          {location && (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                Lat: {location.coords.latitude.toFixed(5)}, Lon: {location.coords.longitude.toFixed(5)}
              </Text>
            </View>
          )}
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
             <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.camera}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
          <View style={styles.cameraUIContainer}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={32} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.shutterButton} onPress={handleTakePicture}>
                <View style={styles.shutterButtonInner} />
              </TouchableOpacity>
            </View>
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
  cameraUIContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 60,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  bottomControls: {
    alignSelf: 'center',
  },
  controlButton: {
    padding: 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  fullScreenImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },  
  sendButton: {
  position: 'absolute',
  bottom: 30,
  right: 20,
  backgroundColor: '#007AFF',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 20,
},
sendButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
  closePreviewButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
    borderRadius: 20,
  },
  locationBox: {
    position: 'absolute',
    top: 60, // adjust as needed
    alignSelf: 'center', // centers content horizontally
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 20,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
  },


});
