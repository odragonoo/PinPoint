import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { Button, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';

export default function ProfileScreen() {
  // Placeholder data for the user profile
  const user = {
    name: 'Dennis Nguyen',
    username: '@denthenguyen',
    bio: 'I like using this app because it uses locations',
    avatar: require('@/assets/images/dennis.png'), // Your local image
  };

  const navigation = useNavigation();

  const handleSignOut = () => {
    // In a real app, you would handle sign-out logic here.
    alert('Signed Out!');
  };

return (
  <View style={{ flex: 1 }}>
    {/* Settings Button */}
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => navigation.navigate('settings')} // <-- must match your route name
    >
      <Ionicons name="settings-outline" size={28} color="white" />
    </TouchableOpacity>

    {/* Rest of the Profile content */}
    <ThemedView style={styles.container}>
      <Image
        source={user.avatar}
        style={styles.avatar}
        onError={(e) => console.log('Failed to load image', e.nativeEvent.error)}
      />
      <ThemedText type="title" style={styles.name}>
        {user.name}
      </ThemedText>
      <ThemedText style={styles.username}>{user.username}</ThemedText>
      <ThemedText style={styles.bio}>{user.bio}</ThemedText>
      <View style={styles.buttonContainer}>
        <Button title="Sign Out" onPress={handleSignOut} color="#ff3b30" />
      </View>
    </ThemedView>
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75, // Make it a circle
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ddd',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    color: '#8e8e93', // A muted gray color
    marginBottom: 10,
  },
  bio: {
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 'auto', // Pushes the button to the bottom
    marginBottom: 40,
    width: '80%',
  },
  settingsButton: {
  position: 'absolute',
  top: 60,
  right: 20,
  zIndex: 10,
  padding: 10,
},
});
