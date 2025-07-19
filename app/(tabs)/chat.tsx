import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Import Firebase modules
import { auth, db } from '@/firebaseConfig';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

// --- Types for our data ---
interface Conversation {
  id: string;
  userName: string; // The name of the other participant in a 1-on-1 chat or group name
  avatar: string; // The avatar of the other participant or group avatar
  lastMessage: string;
  timestamp: any;
  participants: string[]; // Array of user UIDs
  participantNames?: string[]; // Array of user names (for display convenience, optional for existing chats)
  participantAvatars?: string[]; // Array of user avatars (for display convenience, optional for existing chats)
  participantIdsCombined?: string; // IMPORTANT: Added for efficient 1-on-1 chat lookup
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string; // Added email for search functionality (ensure this field exists in Firestore user docs!)
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
      // Ensure email is included if it exists in the user profile document
      return { id: snap.id, email: data.email || '', ...data } as UserProfile;
    } else {
      console.warn(`fetchUserProfiles: Document for UID ${snap.id} does not exist.`);
      return null; // Return null for non-existent documents
    }
  }).filter(Boolean) as UserProfile[]; // Filter out any nulls
  console.log("fetchUserProfiles: Fetched profiles:", profiles);
  return profiles;
};


// --- Sub-Components ---
const FriendItem = ({ user, onRemove, onStartChat }: { user: UserProfile; onRemove: (friendId: string) => void; onStartChat: (friend: UserProfile) => void }) => (
  <View style={styles.itemContainer}>
    <Image source={{ uri: user.avatar }} style={styles.itemAvatar} />
    <ThemedText style={styles.itemName}>{user.name}</ThemedText>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={() => onStartChat(user)} style={[styles.iconButton, { backgroundColor: '#007AFF', marginRight: 10 }]}>
        <Ionicons name="chatbubble-outline" size={20} color="white" />
      </TouchableOpacity>
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

const FoundUserItem = ({ user, onSendRequest }: { user: UserProfile; onSendRequest: (userId: string) => void }) => (
  <View style={styles.itemContainer}>
    <Image source={{ uri: user.avatar }} style={styles.itemAvatar} />
    <ThemedText style={styles.itemName}>{user.name} ({user.email})</ThemedText>
    <View style={styles.itemActions}>
      <TouchableOpacity onPress={() => onSendRequest(user.id)} style={[styles.iconButton, { backgroundColor: '#007AFF' }]}>
        <Ionicons name="person-add-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);


// --- Main Chat Screen Component ---
export default function ChatScreen() {
  const [isFriendsModalVisible, setFriendsModalVisible] = useState(false);
  const [isAddFriendModalVisible, setAddFriendModalVisible] = useState(false); // New state for add friend modal
  const [searchEmail, setSearchEmail] = useState(''); // State for search input
  const [foundUsers, setFoundUsers] = useState<UserProfile[]>([]); // State for found users
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUser = auth.currentUser;
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  // Fetch current user's own profile for displaying in chat items
  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentUserName(data.name || 'You');
        setCurrentUserAvatar(data.avatar || 'https://via.placeholder.com/150');
      }
    });
    return () => unsubscribe();
  }, [currentUser]);


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

    const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('timestamp', 'desc')
    );
    console.log("Listening to chats for user:", currentUser.uid);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const convos: Conversation[] = [];
      const participantIdsToFetch: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversationParticipants: string[] = data.participants || [];

        // For 1-on-1 chats, identify the other participant
        if (conversationParticipants.length === 2) {
          const otherParticipantId = conversationParticipants.find(uid => uid !== currentUser.uid);
          if (otherParticipantId) {
            participantIdsToFetch.push(otherParticipantId);
          }
        }
        convos.push({ id: doc.id, ...data } as Conversation);
      });

      // Fetch profiles for all other participants in conversations
      const uniqueParticipantIds = Array.from(new Set(participantIdsToFetch));
      const participantProfiles = await fetchUserProfiles(uniqueParticipantIds);
      const profileMap = new Map(participantProfiles.map(p => [p.id, p]));

      const populatedConvos = convos.map(conv => {
        // Determine userName and avatar for display
        let displayUserName = 'Unknown Chat';
        let displayAvatar = 'https://via.placeholder.com/150'; // Default avatar

        if (conv.participants.length === 2) {
            const otherParticipantId = conv.participants.find(uid => uid !== currentUser.uid);
            const otherParticipantProfile = profileMap.get(otherParticipantId || '');
            if (otherParticipantProfile) {
                // Use the fetched profile if available
                displayUserName = otherParticipantProfile.name;
                displayAvatar = otherParticipantProfile.avatar;
            } else if (conv.userName && conv.avatar) {
                // Fallback for older/simpler chat documents (like in your screenshot)
                // where userName and avatar fields were directly on the chat document,
                // representing the other person in a 1-on-1.
                displayUserName = conv.userName;
                displayAvatar = conv.avatar;
            }
        } else if (conv.participantNames && conv.participantNames.length > 0) {
            // Logic for potential group chats (if you expand to them later)
            const otherNames = conv.participantNames.filter(name => name !== currentUserName);
            displayUserName = otherNames.join(', '); // Join names for group chat display
            displayAvatar = conv.participantAvatars?.[0] || 'https://via.placeholder.com/150'; // Use first participant's avatar or default
        }


        return {
          ...conv,
          userName: displayUserName,
          avatar: displayAvatar,
        };
      });

      setConversations(populatedConvos);
      setLoading(false);
      console.log("Conversations loaded:", populatedConvos.length);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false); // Stop loading if there's an error
    });
    return () => {
      console.log("Unsubscribing from chats listener.");
      unsubscribe();
    };
  }, [currentUser, currentUserName]); // currentUserName added to dependency array


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
        Alert.alert('Success', 'Friend request accepted!');
        console.log(`Accepted request from ${requesterId} and added to friends.`);
    } catch (error) {
        console.error("Error accepting request:", error);
        Alert.alert('Error', 'Failed to accept friend request.');
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
        Alert.alert('Success', 'Friend request declined.');
        console.log(`Declined request from ${requesterId}.`);
    } catch (error) {
        console.error("Error declining request:", error);
        Alert.alert('Error', 'Failed to decline friend request.');
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
        Alert.alert('Success', 'Friend removed.');
        console.log(`Removed friend ${friendId}.`);
    } catch (error) {
        console.error("Error removing friend:", error);
        Alert.alert('Error', 'Failed to remove friend.');
    }
  };

  // --- New Add Friend Logic ---
  const handleSearchUser = async () => {
    setFoundUsers([]); // Clear previous search results
    if (!searchEmail) {
      Alert.alert('Search Error', 'Please enter an email to search.');
      return;
    }
    if (!currentUser || currentUser.email === searchEmail) {
      Alert.alert('Search Error', 'You cannot search for yourself.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail));

      const querySnapshotSearch = await getDocs(q); // Correct usage for queries

      if (querySnapshotSearch.empty) {
        Alert.alert('No User Found', `No user found with email: ${searchEmail}`);
        return;
      }

      const foundUserList: UserProfile[] = [];
      querySnapshotSearch.forEach(doc => {
        const userData = doc.data();
        // Ensure email is correctly retrieved from userData and assigned to UserProfile
        const userProfile: UserProfile = {
          id: doc.id,
          name: userData.name || 'Unknown',
          avatar: userData.avatar || 'https://via.placeholder.com/150',
          email: userData.email || '', // Ensure email field is present, assuming it's stored
        };

        // Check if the user is already a friend or has a pending request from current user
        if (friends.some(f => f.id === doc.id)) {
          Alert.alert('Already Friends', `${userProfile.name} is already your friend.`);
        } else if (requests.some(r => r.id === doc.id)) {
          Alert.alert('Request Pending', `You have a pending friend request from ${userProfile.name}.`);
        } else if (userData.friendRequests && userData.friendRequests.includes(currentUser.uid)) {
            // Check if current user has already sent a request to this person
            Alert.alert('Request Sent', `You have already sent a friend request to ${userProfile.name}.`);
        } else {
          foundUserList.push(userProfile);
        }
      });
      setFoundUsers(foundUserList);
    } catch (error) {
      console.error("Error searching for user:", error);
      Alert.alert('Search Error', 'An error occurred while searching for the user.');
    }
  };

  const handleSendFriendRequest = async (recipientId: string) => {
    if (!currentUser) return;
    console.log("Sending friend request to:", recipientId);
    const recipientRef = doc(db, 'users', recipientId);

    try {
      await updateDoc(recipientRef, {
        friendRequests: arrayUnion(currentUser.uid),
      });
      Alert.alert('Success', 'Friend request sent!');
      setSearchEmail('');
      setFoundUsers([]);
      setAddFriendModalVisible(false); // Close modal after sending request
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert('Error', 'Failed to send friend request.');
    }
  };

  // --- New Start Chat Logic ---
  const handleStartChat = async (friend: UserProfile) => {
    if (!currentUser) return;

    // 1. Generate a consistent chat ID for 1-on-1 chats
    const participants = [currentUser.uid, friend.id].sort(); // Sort UIDs to ensure consistent order
    const chatIdForQuery = participants.join('_'); // e.g., "UID1_UID2"

    // 2. Query using the combined ID field to find existing 1-on-1 chats
    const q = query(
      collection(db, 'chats'),
      where('participantIdsCombined', '==', chatIdForQuery) // <--- CRITICAL FIX HERE
    );

    try {
      const querySnapshot = await getDocs(q);
      let chatId;

      if (!querySnapshot.empty) {
        // Chat exists, navigate to it
        chatId = querySnapshot.docs[0].id;
        console.log("Existing chat found:", chatId);
      } else {
        // No chat exists, create a new one
        console.log("No existing chat, creating new one...");

        // Determine the 'other' participant's info for the top-level userName and avatar
        // This is for display compatibility with your existing chat document structure.
        const otherParticipantName = friend.name;
        const otherParticipantAvatar = friend.avatar;

        const newChatData = {
          participants: [currentUser.uid, friend.id],
          // These fields are arrays for more flexible group chat handling in the future,
          // but also required by the stricter rules for new chat creation.
          participantNames: [currentUserName, friend.name],
          participantAvatars: [currentUserAvatar, friend.avatar],
          lastMessage: '',
          timestamp: serverTimestamp(),
          // This field is for efficient lookup of 1-on-1 chats.
          participantIdsCombined: chatIdForQuery,
          // These top-level fields match your existing single-user chat document structure
          // and are expected by the security rules for 'create'.
          userName: otherParticipantName,
          avatar: otherParticipantAvatar,
        };
        // ADD THIS LINE HERE:
        console.log("New chat data being sent:", JSON.stringify(newChatData, null, 2)); // Use JSON.stringify for pretty printing

        const docRef = await addDoc(collection(db, 'chats'), newChatData);
        chatId = docRef.id;
        console.log("New chat created with ID:", chatId);
      }
      setFriendsModalVisible(false); // Close friends modal
      router.push(`/chat/${chatId}`); // Navigate to the chat screen
    } catch (error) {
      console.error("Error starting/creating chat:", error);
      Alert.alert('Error', 'Failed to start chat.');
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
          {item.lastMessage || "Start chatting!"} {/* Display a message if no last message */}
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

            {/* Add Friend Button */}
            <TouchableOpacity
              onPress={() => {
                setFriendsModalVisible(false); // Close this modal
                setAddFriendModalVisible(true); // Open add friend modal
              }}
              style={styles.addFriendButton}>
              <Ionicons name="person-add-outline" size={20} color="white" />
              <ThemedText style={styles.addFriendButtonText}>Add New Friend</ThemedText>
            </TouchableOpacity>


            <ThemedText type="subtitle" style={styles.sectionTitle}>Friend Requests ({requests.length})</ThemedText>
            {requests.length === 0 ? (
                <ThemedText style={styles.noItemsText}>No pending friend requests.</ThemedText>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={({ item }) => <RequestItem user={item} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    scrollEnabled={false}
                />
            )}

            <ThemedText type="subtitle" style={styles.sectionTitle}>My Friends ({friends.length})</ThemedText>
            {friends.length === 0 ? (
                <ThemedText style={styles.noItemsText}>No friends added yet.</ThemedText>
            ) : (
                <FlatList
                    data={friends}
                    renderItem={({ item }) => <FriendItem user={item} onRemove={handleRemoveFriend} onStartChat={handleStartChat} />}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    scrollEnabled={false}
                />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Friend Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddFriendModalVisible}
        onRequestClose={() => {
          setAddFriendModalVisible(false);
          setSearchEmail('');
          setFoundUsers([]);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">Add New Friend</ThemedText>
              <TouchableOpacity onPress={() => {
                setAddFriendModalVisible(false);
                setSearchEmail('');
                setFoundUsers([]);
              }}>
                <Ionicons name="close-circle" size={30} color="#8e8e93" />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.label}>Search by Email:</ThemedText>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter friend's email"
                placeholderTextColor="#8e8e93"
                value={searchEmail}
                onChangeText={setSearchEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleSearchUser} style={styles.searchButton}>
                <Ionicons name="search" size={20} color="white" />
                <ThemedText style={styles.searchButtonText}>Search</ThemedText>
              </TouchableOpacity>
            </View>

            {foundUsers.length > 0 && (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Search Results</ThemedText>
                <FlatList
                  data={foundUsers}
                  renderItem={({ item }) => (
                    <FoundUserItem user={item} onSendRequest={handleSendFriendRequest} />
                  )}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  scrollEnabled={false}
                />
              </>
            )}
            {/* Display message if search was performed and no users were found */}
            {searchEmail.length > 0 && foundUsers.length === 0 && (
                <ThemedText style={styles.noItemsText}>No users found or already managed with that email.</ThemedText>
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
  noItemsText: { textAlign: 'center', marginTop: 10, marginBottom: 20, color: '#8e8e93' },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34c759',
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    marginTop: 10,
  },
  addFriendButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    color: '#333', // Ensure text is visible
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchButtonText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});