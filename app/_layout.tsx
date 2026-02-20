import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/Themecontext';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AdsManager from '../services/adsManager';
import PurchaseManager from '../services/purchaseManager';

// Global premium state — poori app me accessible
export let isUserPremium = false;

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. IAP initialize karo
      await PurchaseManager.initialize();

      // 2. Premium status check karo App Store se
      // (reinstall ke baad bhi kaam karega)
      const premiumStatus = await PurchaseManager.checkAndRestorePremium();
      isUserPremium = premiumStatus;
      console.log('👑 Premium status:', premiumStatus);

      // 3. Agar premium nahi hai tabhi ads initialize karo
      if (!premiumStatus) {
        await AdsManager.initializeAds();
        console.log('📢 Ads initialized (user is not premium)');
      } else {
        console.log('✅ User is premium — ads skipped');
      }
    } catch (error) {
      console.log('App init error:', error);
      // Fallback: ads initialize karo
      await AdsManager.initializeAds();
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack>
          <Stack.Screen
            name="SplashScreen"
            options={{ headerShown: false, animation: 'none' }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="NoteEditor" options={{ headerShown: false }} />
          <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="Languageselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="Themeselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="PremiumScreen" options={{ headerShown: false }} />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}