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
} from "react-native";
import { auth, db } from "../lib/firebase";

const { width } = Dimensions.get("window");

const onboardingSlides = [
  {
    title: "Live Location Sharing",
    description: "See your friends on a real-time map — just like Life360 and Snap Map.",
  },
  {
    title: "Social Meetups",
    description: "Chat, share status updates, and plan spontaneous meetups.",
  },
  {
    title: "Friend Requests & Privacy",
    description: "Control who sees you. Accept or reject friend requests anytime.",
  },
];

const SignUp: React.FC = () => {
  const router = useRouter();

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
      <View style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {onboardingSlides.map((slide, index) => (
            <View style={styles.slide} key={index}>
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Sign Up" onPress={handleSignUp} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          title="Already have an account? Log In"
          onPress={() => router.push("/login")}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  slide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
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
