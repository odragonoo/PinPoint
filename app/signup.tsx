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
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../lib/firebase"; // your existing Firebase setup  [oai_citation:0‡GitHub](https://raw.githubusercontent.com/pinpointvoodoo/PinPoint/main/lib/firebase.ts)

const SignUp: React.FC = () => {
  const router = useRouter();
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
      // create the user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // store the username
      await updateProfile(userCred.user, { displayName: username });

      // Create Firestore user doc with all required fields
      await setDoc(doc(db, "users", userCred.user.uid), {
        avatar: null,
        bio: null,
        email: email,
        friendRequests: [],
        friends: [],
        name: username,
      });

      setError("");
      // go into the app
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Sign Up Error", err.message);
    }
  };

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
    padding: 24,
    backgroundColor: "#fff",
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
    marginBottom: 16,
  },
  error: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
});

export default SignUp;