import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AppService } from '../services/AppService';
import { useNotificationHandler } from '../hooks/useNotificationHandler';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Set up notification handling
  useNotificationHandler();
  
  // Set up realtime updates
  useRealtimeUpdates();

  useEffect(() => {
    if (loaded) {
      AppService.initializeApp();
    }
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tasks/index" options={{ title: 'タスク管理' }} />
        <Stack.Screen name="tasks/create" options={{ title: '新しいタスク' }} />
        <Stack.Screen name="tasks/[id]/edit" options={{ title: 'タスク編集' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
