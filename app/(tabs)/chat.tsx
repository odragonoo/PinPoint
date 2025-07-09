import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons'; // Make sure you have @expo/vector-icons installed
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// --- Mock Data ---
const friendsData = [
  { id: 'f1', name: 'Alice', avatar: 'https://placehold.co/100x100/e8e8e8/000?text=A' },
  { id: 'f2', name: 'Bob', avatar: 'https://placehold.co/100x100/d1d1d1/000?text=B' },
  // Example of a broken URL that will use the fallback
  { id: 'f3', name: 'Charlie', avatar: 'https://invalid-url.xyz/image.png' },
];

const requestsData = [
  { id: 'r1', name: 'David', avatar: 'https://placehold.co/100x100/c2c2c2/000?text=D' },
];

const conversationsData = [
  {
    id: 'c1',
    userName: 'Alice',
    avatar: 'https://placehold.co/100x100/e8e8e8/000?text=A',
    lastMessage: 'Sounds good! See you then.',
    timestamp: '10:42 AM',
  },
  {
    id: 'c2',
    userName: 'Bob',
    avatar: 'https://placehold.co/100x100/d1d1d1/000?text=B',
    lastMessage: 'Can you send me that file?',
    timestamp: 'Yesterday',
  },
  {
    id: 'c3',
    userName: 'Charlie',
    avatar: 'https://invalid-url.xyz/image.png',
    lastMessage: 'Okay, I will check it out.',
    timestamp: '7/7/25',
  },
];

// Fallback image to display if the primary one fails
const fallbackAvatar = 'https://placehold.co/100x100/cccccc/ffffff?text=N/A';

// --- Sub-Components ---
const FriendItem = ({ name, avatar }: { name: string; avatar: string }) => {
  const [imgUri, setImgUri] = useState(avatar);
  return (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: imgUri }}
        style={styles.itemAvatar}
        onError={() => setImgUri(fallbackAvatar)}
      />
      <ThemedText style={styles.itemName}>{name}</ThemedText>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#ff3b30' }]}>
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RequestItem = ({ name, avatar }: { name: string; avatar: string }) => {
  const [imgUri, setImgUri] = useState(avatar);
  return (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: imgUri }}
        style={styles.itemAvatar}
        onError={() => setImgUri(fallbackAvatar)}
      />
      <ThemedText style={styles.itemName}>{name}</ThemedText>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#34c759', marginRight: 10 }]}>
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#ff3b30' }]}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChatItem = ({ item }: { item: typeof conversationsData[0] }) => {
  const router = useRouter();
  const [imgUri, setImgUri] = useState(item.avatar);

  return (
    <TouchableOpacity
      style={styles.chatItemContainer}
      onPress={() => router.push(`/chat/${item.id}`)}>
      <Image
        source={{ uri: imgUri }}
        style={styles.chatAvatar}
        onError={() => setImgUri(fallbackAvatar)}
      />
      <View style={styles.chatTextContainer}>
        <ThemedText style={styles.chatUserName}>{item.userName}</ThemedText>
        <ThemedText style={styles.chatLastMessage} numberOfLines={1}>{item.lastMessage}</ThemedText>
      </View>
      <ThemedText style={styles.chatTimestamp}>{item.timestamp}</ThemedText>
    </TouchableOpacity>
  );
};

// --- Main Chat Screen Component ---
export default function ChatScreen() {
  const [isFriendsModalVisible, setFriendsModalVisible] = useState(false);

  return (
    <ThemedView style={styles.container}>
      {/* Header with Friends Button */}
      <View style={styles.header}>
        <ThemedText type="title">Chats</ThemedText>
        <TouchableOpacity onPress={() => setFriendsModalVisible(true)} style={styles.friendsButton}>
          <Ionicons name="people-sharp" size={24} color="#007AFF" />
          <ThemedText style={styles.friendsButtonText}>Friends</ThemedText>
        </TouchableOpacity>
      </View>

      {/* List of active chats */}
      <FlatList
        data={conversationsData}
        renderItem={({ item }) => <ChatItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatListContainer}
      />

      {/* Friends Management Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFriendsModalVisible}
        onRequestClose={() => setFriendsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Manage Friends</ThemedText>
              <TouchableOpacity onPress={() => setFriendsModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#8e8e93" />
              </TouchableOpacity>
            </View>

            {/* Friend Requests Section */}
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Friend Requests ({requestsData.length})
            </ThemedText>
            <FlatList
              data={requestsData}
              renderItem={({ item }) => <RequestItem name={item.name} avatar={item.avatar} />}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />

            {/* Friends List Section */}
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              My Friends ({friendsData.length})
            </ThemedText>
            <FlatList
              data={friendsData}
              renderItem={({ item }) => <FriendItem name={item.name} avatar={item.avatar} />}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  friendsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  chatListContainer: {
    paddingHorizontal: 10,
  },
  // Chat Item Styles
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#f0f0f0', // Add a background color for the loading state
  },
  chatTextContainer: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 17,
    fontWeight: '600',
  },
  chatLastMessage: {
    fontSize: 15,
    color: '#8e8e93',
  },
  chatTimestamp: {
    fontSize: 13,
    color: '#8e8e93',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  list: {
    flexGrow: 0,
  },
  // Friend/Request Item Styles
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f0f0f0', // Add a background color for the loading state
  },
  itemName: {
    flex: 1,
    fontSize: 18,
  },
  itemActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});
