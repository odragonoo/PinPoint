import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Slot, useRouter, useSegments } from 'expo-router';
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
      <Slot />
    </PhotoProvider>
    <StatusBar style="auto" />
  </ThemeProvider>
);

}
