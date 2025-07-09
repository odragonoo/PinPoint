import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraTabScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const router = useRouter();

  // Show a loading indicator while waiting for the permission status.
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // If permissions are not granted, show a message and a button to request them.
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

  // Function to toggle between front and back camera
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Function to handle taking a picture (placeholder)
  const handleTakePicture = () => {
    alert('Photo taken! (simulation)');
    // In a real app, you would use cameraRef.current.takePictureAsync()
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.cameraUIContainer}>
          {/* Top controls: Close and Flip Camera */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls: Shutter button */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.shutterButton} onPress={handleTakePicture}>
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
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
});
