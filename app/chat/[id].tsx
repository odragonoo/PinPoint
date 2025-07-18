// app/chat/[id].tsx

import { auth, db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons'; // Make sure Ionicons is imported
import { useLocalSearchParams, useNavigation } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// --- Interfaces for our data types ---
interface ChatData {
  userName: string;
  avatar: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

export default function IndividualChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  const [chat, setChat] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // --- Set the navigation header ---
  useLayoutEffect(() => {
    if (chat) {
      navigation.setOptions({
        // ✅ ADD THIS to create a custom back button
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <View style={styles.headerContainer}>
            <Image source={{ uri: chat.avatar }} style={styles.headerAvatar} />
            <Text style={styles.headerTitle}>{chat.userName}</Text>
          </View>
        ),
        // This just hides the "Back" text on iOS, but doesn't add the button
        headerBackTitleVisible: false,
      });
    }
  }, [navigation, chat]);

  // --- Fetch initial chat metadata ---
  useEffect(() => {
    if (!chatId) return;
    const chatDocRef = doc(db, 'chats', chatId);
    getDoc(chatDocRef).then(docSnap => {
      if (docSnap.exists()) {
        setChat(docSnap.data() as ChatData);
      }
    });
  }, [chatId]);

  // --- Listen for real-time messages ---
  useEffect(() => {
    if (!chatId) return;
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, querySnapshot => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  // --- Function to send a message ---
  const handleSend = async () => {
    if (newMessage.trim() === '' || !currentUser || !chatId) return;
    const trimmedMessage = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: trimmedMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#000" /></View>;
  }

  // --- Render Functions ---
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser?.uid;
    return (
      <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        style={styles.messageList}
        inverted
        contentContainerStyle={{ paddingTop: 10 }}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor="#8e8e8e"
            multiline
          />
          {newMessage.trim().length > 0 && (
            <TouchableOpacity onPress={handleSend}>
              <Text style={styles.sendButton}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  // Header Styles
  // ✅ ADD THIS STYLE for the back button
  headerBack: {
    paddingHorizontal: 10,
  },
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginLeft: -15, // Adjust to align title correctly
  },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  // Message List
  messageList: { flex: 1, paddingHorizontal: 10, },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxWidth: '75%',
  },
  myMessageBubble: {
    backgroundColor: '#3797F0',
    borderBottomRightRadius: 5,
  },
  theirMessageBubble: {
    backgroundColor: '#EFEFEF',
    borderBottomLeftRadius: 5,
  },
  myMessageText: { color: 'white' },
  theirMessageText: { color: 'black' },
  // Input Bar
  inputContainer: { padding: 10, borderTopWidth: 1, borderTopColor: '#dbdbdb', backgroundColor: '#fff' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  textInput: { flex: 1, fontSize: 16, },
  sendButton: { color: '#3797F0', fontWeight: '600', fontSize: 16, marginLeft: 10 },
});