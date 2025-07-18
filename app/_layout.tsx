// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, useRouter, useSegments } from 'expo-router'; // Import Stack
import { useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { PhotoProvider } from '../lib/PhotoContext';


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return <RootLayoutInner />;
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { currentUser, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === 'login';
    console.log("Auth state changed. currentUser:", currentUser);
    if (!currentUser && !inAuthGroup) {
      router.replace('/login');
    } else if (currentUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [currentUser, initializing, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PhotoProvider>
        {/* ✅ Replace <Slot /> with <Stack /> */}
        <Stack>
          {/* This screen handles all your tabs. We hide its header to avoid a double header. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* This screen is for your login page. */}
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* This screen is for your individual chats. The header will now be visible by default. */}
          <Stack.Screen name="chat/[id]" />
        </Stack>
        
        <StatusBar style="auto" />
      </PhotoProvider>
    </ThemeProvider>
  );
}