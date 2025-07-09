import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// --- Mock Data for the Feed ---
const pinpointData = [
  {
    id: '1',
    user: {
      name: 'CampusExplorer',
      avatar: 'https://placehold.co/100x100/e8e8e8/000?text=CE',
    },
    location: 'Tech Green, Georgia Tech',
    videoUri: 'https://placehold.co/1080x1920/333/fff?text=Drone+Footage', // Placeholder for video
    likes: '1.2k',
    comments: '48',
  },
  {
    id: '2',
    user: {
      name: 'FoodieFinds',
      avatar: 'https://placehold.co/100x100/d1d1d1/000?text=FF',
    },
    location: 'The Varsity',
    videoUri: 'https://placehold.co/1080x1920/555/fff?text=What\'ll+Ya+Have!',
    likes: '892',
    comments: '112',
  },
  {
    id: '3',
    user: {
      name: 'LibraryLife',
      avatar: 'https://placehold.co/100x100/b0b0b0/000?text=LL',
    },
    location: 'Crosland Tower',
    videoUri: 'https://placehold.co/1080x1920/444/fff?text=Study+Session',
    likes: '450',
    comments: '32',
  },
];

// --- Gets the screen dimensions ---
const { height: screenHeight } = Dimensions.get('window');

// --- Pinpoint Item Component (A single video in the feed) ---
const PinpointItem = ({ item }: { item: typeof pinpointData[0] }) => (
  <ImageBackground
    source={{ uri: item.videoUri }}
    style={styles.pinpointItemContainer}
    resizeMode="cover">
    <View style={styles.overlay}>
      {/* Content Overlay */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.locationText}>
          <Ionicons name="location-sharp" size={16} /> {item.location}
        </ThemedText>
        <View style={styles.userContainer}>
          <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
          <ThemedText style={styles.userName}>{item.user.name}</ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart" size={35} color="white" />
          <ThemedText style={styles.actionText}>{item.likes}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-ellipses" size={35} color="white" />
          <ThemedText style={styles.actionText}>{item.comments}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo" size={35} color="white" />
          <ThemedText style={styles.actionText}>Share</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  </ImageBackground>
);

// --- Main Pinpoint Screen Component ---
export default function PinpointScreen() {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={pinpointData}
        renderItem={({ item }) => <PinpointItem item={item} />}
        keyExtractor={(item) => item.id}
        pagingEnabled // Snaps to each video
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pinpointItemContainer: {
    height: screenHeight,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingBottom: 100, // Make space for tab bar
  },
  contentContainer: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  locationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 10,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 25,
  },
  actionText: {
    color: 'white',
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
