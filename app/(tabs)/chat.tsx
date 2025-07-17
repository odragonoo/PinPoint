import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
// Import Firebase modules
import { auth, db } from '@/firebaseConfig';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

// --- Types for our data ---
interface Conversation {
  id: string;
  userName: string;
  avatar: string;
  lastMessage: string;
  timestamp: any;
  participants: string[]; // Array of user UIDs
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

// --- Helper function to get user profiles from IDs ---
const fetchUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
  if (userIds.length === 0) {
    console.log("fetchUserProfiles: No user IDs provided, returning empty array.");
    return [];
  }
  console.log("fetchUserProfiles: Fetching profiles for UIDs:", userIds);
  const profilePromises = userIds.map(id => getDoc(doc(db, 'users', id)));
  const profileSnapshots = await Promise.all(profilePromises);
  const profiles = profileSnapshots.map(snap => {
    if (snap.exists()) {
      const data = snap.data();
      console.log(`fetchUserProfiles: Found profile for ${snap.id}:`, data);
      return { id: snap.id, ...data } as UserProfile;
    } else {
      console.warn(`fetchUserProfiles: Document for UID ${snap.id} does not exist.`);
      return null; // Return null for non-existent documents
    }
  }).filter(Boolean) as UserProfile[]; // Filter out any nulls
  console.log("fetchUserProfiles: Fetched profiles:", profiles);
  return profiles;
};


// --- Sub-Components ---
const FriendItem = ({ user, onRemove }: { user: UserProfile; onRemove: (friendId: string) => void }) => (
  <View style={styles.itemContainer}>
    <Image source={{ uri: user.avatar }} style={styles.itemAvatar} />
    <ThemedText style={styles.itemName}>{user.name}</ThemedText>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={() => onRemove(user.id)} style={[styles.iconButton, { backgroundColor: '#ff3b30' }]}>
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

const RequestItem = ({ user, onAccept, onDecline }: { user: UserProfile; onAccept: (reqId: string) => void; onDecline: (reqId: string) => void }) => (
  <View style={styles.itemContainer}>
    <Image source={{ uri: user.avatar }} style={styles.itemAvatar} />
    <ThemedText style={styles.itemName}>{user.name}</ThemedText>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={() => onAccept(user.id)} style={[styles.iconButton, { backgroundColor: '#34c759', marginRight: 10 }]}>
        <Ionicons name="checkmark" size={20} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDecline(user.id)} style={[styles.iconButton, { backgroundColor: '#ff3b30' }]}>
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);


// --- Main Chat Screen Component ---
export default function ChatScreen() {
  const [isFriendsModalVisible, setFriendsModalVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUser = auth.currentUser;

  useEffect(() => {
    console.log("ChatScreen mounted. Current user:", currentUser?.uid);
    if (!currentUser) {
      console.log("No current user, setting loading to false.");
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    console.log("Listening to user document:", currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.warn(`User document for ${currentUser.uid} does not exist!`);
        setFriends([]);
        setRequests([]);
        return;
      }
      const userData = snapshot.data();
      console.log("User data received:", userData);

      if (userData) {
        const rawFriendRequests = userData.friendRequests || [];
        const rawFriends = userData.friends || [];
        console.log("Raw friend requests from DB:", rawFriendRequests);
        console.log("Raw friends from DB:", rawFriends);

        const friendProfiles = await fetchUserProfiles(rawFriends);
        const requestProfiles = await fetchUserProfiles(rawFriendRequests);
        
        setFriends(friendProfiles);
        setRequests(requestProfiles);
        console.log("Updated friends state:", friendProfiles);
        console.log("Updated requests state:", requestProfiles);
      } else {
        console.log("User data is empty.");
        setFriends([]);
        setRequests([]);
      }
    }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false); // Stop loading if there's an error
    });

    return () => {
      console.log("Unsubscribing from user document listener.");
      unsubscribe();
    };
  }, [currentUser]);


  // --- Fetch conversations from Firebase ---
  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    };

    // This query now correctly filters for chats where the current user is a participant
    const q = query(
        collection(db, 'chats'), 
        where('participants', 'array-contains', currentUser.uid),
        orderBy('timestamp', 'desc')
    );
    console.log("Listening to chats for user:", currentUser.uid);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const convos: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        convos.push({ id: doc.id, ...data } as Conversation);
      });
      setConversations(convos);
      setLoading(false);
      console.log("Conversations loaded:", convos.length);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false); // Stop loading if there's an error
    });
    return () => {
      console.log("Unsubscribing from chats listener.");
      unsubscribe();
    };
  }, [currentUser]);

  // --- Friend Management Functions ---
  const handleAcceptRequest = async (requesterId: string) => {
    if (!currentUser) return;
    console.log("Accepting request from:", requesterId);
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const requesterRef = doc(db, 'users', requesterId);

    try {
        // Add each other as friends and remove the request
        await updateDoc(currentUserRef, {
            friends: arrayUnion(requesterId),
            friendRequests: arrayRemove(requesterId),
        });
        await updateDoc(requesterRef, {
            friends: arrayUnion(currentUser.uid),
        });
        console.log(`Accepted request from ${requesterId} and added to friends.`);
    } catch (error) {
        console.error("Error accepting request:", error);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!currentUser) return;
    console.log("Declining request from:", requesterId);
    const currentUserRef = doc(db, 'users', currentUser.uid);
    try {
        await updateDoc(currentUserRef, {
            friendRequests: arrayRemove(requesterId),
        });
        console.log(`Declined request from ${requesterId}.`);
    } catch (error) {
        console.error("Error declining request:", error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;
    console.log("Removing friend:", friendId);
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const friendRef = doc(db, 'users', friendId);

    try {
        // Remove each other from friends lists
        await updateDoc(currentUserRef, { friends: arrayRemove(friendId) });
        await updateDoc(friendRef, { friends: arrayRemove(currentUser.uid) });
        console.log(`Removed friend ${friendId}.`);
    } catch (error) {
        console.error("Error removing friend:", error);
    }
  };


  const ChatItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.chatItemContainer}
      onPress={() => router.push(`/chat/${item.id}`)}>
      <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
      <View style={styles.chatTextContainer}>
        <ThemedText style={styles.chatUserName}>{item.userName}</ThemedText>
        <ThemedText style={styles.chatLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </ThemedText>
      </View>
      <ThemedText style={styles.chatTimestamp}>
        {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return <ThemedView style={styles.centered}><ActivityIndicator size="large" /></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Chats</ThemedText>
        <TouchableOpacity onPress={() => setFriendsModalVisible(true)} style={styles.friendsButton}>
          <Ionicons name="people-sharp" size={24} color="#007AFF" />
          <ThemedText style={styles.friendsButtonText}>Friends</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={conversations}
        renderItem={({ item }) => <ChatItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatListContainer}
        ListEmptyComponent={<View style={styles.centered}><ThemedText>No conversations yet.</ThemedText></View>}
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

            <ThemedText type="subtitle" style={styles.sectionTitle}>Friend Requests ({requests.length})</ThemedText>
            {requests.length === 0 ? (
                <ThemedText style={styles.noItemsText}>No pending friend requests.</ThemedText>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={({ item }) => <RequestItem user={item} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    scrollEnabled={false} // Prevent inner FlatList from scrolling if modal itself scrolls
                />
            )}

            <ThemedText type="subtitle" style={styles.sectionTitle}>My Friends ({friends.length})</ThemedText>
            {friends.length === 0 ? (
                <ThemedText style={styles.noItemsText}>No friends added yet.</ThemedText>
            ) : (
                <FlatList
                    data={friends}
                    renderItem={({ item }) => <FriendItem user={item} onRemove={handleRemoveFriend} />}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    scrollEnabled={false} // Prevent inner FlatList from scrolling
                />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  friendsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  friendsButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#007AFF' },
  chatListContainer: { paddingHorizontal: 10 },
  chatItemContainer: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  chatAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#f0f0f0' },
  chatTextContainer: { flex: 1 },
  chatUserName: { fontSize: 17, fontWeight: '600' },
  chatLastMessage: { fontSize: 15, color: '#8e8e93' },
  chatTimestamp: { fontSize: 13, color: '#8e8e93' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { height: '85%', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { marginTop: 15, marginBottom: 10, fontWeight: 'bold' },
  list: { flexGrow: 0 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#f0f0f0' },
  itemName: { flex: 1, fontSize: 18 },
  itemActions: { flexDirection: 'row' },
  iconButton: { padding: 8, borderRadius: 20 },
  noItemsText: { textAlign: 'center', marginTop: 10, marginBottom: 20, color: '#8e8e93' }, // Added style
});