import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { auth } from "../lib/firebase";

const Login: React.FC = () => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#222';
  const buttonColor = colorScheme === 'dark' ? '#fff' : '#222';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Login Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: textColor }]}>Login</Text>
      <TextInput
        placeholder="Email"
        style={[styles.input, { color: textColor }]}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
      />
      <TextInput
        placeholder="Password"
        style={[styles.input, { color: textColor }]}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
      />
      <Button title="Login" onPress={handleLogin} color={buttonColor} />
      {error ? <Text style={[styles.error, { color: colorScheme === 'dark' ? '#ff6b6b' : 'red' }]}>{error}</Text> : null}
      {/* Navigate to Sign Up */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Don't have an account? Sign Up"
          onPress={() => router.push('/signup')}
          color={buttonColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  error: {
    color: "red",
    marginTop: 8,
  },
});

export default Login;