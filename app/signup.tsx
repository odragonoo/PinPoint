import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { auth, db } from "../lib/firebase";

const { width, height } = Dimensions.get("window");

const onboardingSlides = [
  {
    emoji: "🗺️",
    title: "Post on the Map",
    description: "Drop updates, photos, or check-ins directly on a map — not a swipe feed.",
  },
  {
    emoji: "📍",
    title: "See What’s Around You",
    description: "View posts from friends and locals near you in real-time.",
  },
  {
    emoji: "👥",
    title: "Live Friends + Location",
    description: "See friends live on the map. Like Snap Map meets social posting.",
  },
];

const SignUp: React.FC = () => {
  const router = useRouter();

  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#fff';
  const textColor = colorScheme === 'dark' ? '#fff' : '#222';
  const buttonColor = colorScheme === 'dark' ? '#fff' : '#222';

  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!email || !username || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: username });

      await setDoc(doc(db, "users", userCred.user.uid), {
        avatar: null,
        bio: null,
        email,
        friendRequests: [],
        friends: [],
        name: username,
      });

      setError("");
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Sign Up Error", err.message);
    }
  };

  if (!onboardingComplete) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {onboardingSlides.map((slide, index) => (
            <View style={styles.slide} key={index}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ padding: 20 }}>
          <Button title="Get Started" onPress={() => setOnboardingComplete(true)} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={[styles.heading, { color: textColor }]}>Create Account</Text>

      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Email"
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Username"
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Password"
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Sign Up" onPress={handleSignUp} color={buttonColor} />
      {error ? <Text style={[styles.error, { color: colorScheme === 'dark' ? '#ff6b6b' : 'red' }]}>{error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          title="Already have an account? Log In"
          onPress={() => router.push("/login")}
          color={buttonColor}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  error: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
});

export default SignUp;
