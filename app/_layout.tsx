import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/Themecontext';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack>
          {/* 
            ✅ SPLASH SCREEN — Entry point of the app
            - Shows logo + animations
            - Loads ads from Firebase
            - Shows interstitial ad
            - Navigates to /(tabs) after ad closes
          */}
          <Stack.Screen
            name="SplashScreen"
            options={{
              headerShown: false,
              animation: 'none', // No animation for splash
            }}
          />

          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SettingsScreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Languageselectionscreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Themeselectionscreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PremiumScreen"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}