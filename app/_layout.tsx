// app/_layout.tsx

import 'react-native-gesture-handler'; // <--- ADD IT HERE, AS THE VERY FIRST LINE OF THE FILE

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, useRouter, useSegments } from 'expo-router'; // Import Stack
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/contexts/AuthContext';
import { PhotoProvider } from '../lib/PhotoContext';


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { currentUser, initializing } = useAuth();

  // 2) Once auth is resolved, redirect as needed
  useEffect(() => {
    const inAuthGroup = ['login', 'signup'].includes(segments[0]);
    if (!currentUser && !inAuthGroup) {
      router.replace('/login');
    } else if (currentUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [currentUser, initializing, segments, router]);

  // 1) Block rendering until we know auth state
  if (initializing) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PhotoProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {!currentUser ? (
            <>
              {/* Unauthenticated screens */}
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
            </>
          ) : (
            <>
              {/* Authenticated screens */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[id]" />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </PhotoProvider>
    </ThemeProvider>
  );
}