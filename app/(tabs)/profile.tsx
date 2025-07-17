import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserProfile } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, firestore } from '../../lib/firebase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // ✅ Placeholder images from local assets
  const placeholderPins = [
    { id: '1', image: require('../../assets/images/exPins/bunBoHue.png') },
    { id: '2', image: require('../../assets/images/exPins/cat.png') },
    { id: '3', image: require('../../assets/images/exPins/blackcatpt1.png') },
    { id: '4', image: require('../../assets/images/exPins/blackcatpt2.png') },
  ];

  const [pins, setPins] = useState(placeholderPins);
  const [pinCount, setPinCount] = useState(placeholderPins.length);
  const [followerCount, setFollowerCount] = useState(9); // Hardcoded for now

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            setProfile(data as UserProfile);
          } else {
            console.log('No user profile found!');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={28} color="white" />
      </TouchableOpacity>

      {/* Profile Content */}
      <ThemedView style={styles.container}>
        {profile ? (
          <>
            <Image
              source={{
                uri: profile.avatar || 'https://via.placeholder.com/150',
              }}
              style={styles.avatar}
              onError={(e) =>
                console.log('Failed to load image', e.nativeEvent.error)
              }
            />
            <ThemedText type="title" style={styles.name}>
              {profile.name}
            </ThemedText>
            <ThemedText style={styles.bio}>
              {profile.bio || 'No bio yet...'}
            </ThemedText>

            {/* Pins / Followers */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Pins</ThemedText>
                <ThemedText style={styles.statValue}>{pinCount}</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Followers</ThemedText>
                <ThemedText style={styles.statValue}>{followerCount}</ThemedText>
              </View>
            </View>

            {/* Grid of Pins */}
            <FlatList
  data={pins}
  keyExtractor={(item) => item.id}
  numColumns={2}
  contentContainerStyle={{ ...styles.gridContainer, flexGrow: 1 }}
  columnWrapperStyle={styles.gridRow}
  renderItem={({ item }) => (
    <Image source={item.image} style={styles.pinImage} />
  )}
  showsVerticalScrollIndicator={false}
/>


          </>
        ) : (
          <ThemedText>Loading profile...</ThemedText>
        )}
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
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#ddd',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  bio: {
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  gridContainer: {
  paddingHorizontal: 16,
  paddingBottom: 40,
},
gridRow: {
  justifyContent: 'space-between',
  marginBottom: 16,
},
pinImage: {
  width: '48%', // slightly less than 50% to allow spacing
  aspectRatio: 1, // keeps it square
  borderRadius: 12,
},

});
