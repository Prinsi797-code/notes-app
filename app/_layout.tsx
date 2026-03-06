import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/Themecontext';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AdsManager from '../services/adsManager';
import PurchaseManager from '../services/purchaseManager';

// Global premium state — poori app me accessible
export let isUserPremium = false;

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  // Track karo kya ads initialize ho chuki hain
  const adsInitialized = useRef(false);

  useEffect(() => {
    initApp();
  }, []);

  // AppState listener — background se foreground aane par ad dikhao
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // Sirf tab trigger ho jab app background/inactive se active ho
    if (
      (appState.current === 'background' || appState.current === 'inactive') &&
      nextAppState === 'active'
    ) {
      console.log('📱 App came to foreground (resume)');

      // Ads initialized ho chuki hain aur user premium nahi hai
      if (adsInitialized.current && !isUserPremium) {
        await AdsManager.showAppResumeAd();
      }
    }

    appState.current = nextAppState;
  };

  const initApp = async () => {
    try {
      // 1. IAP initialize karo
      await PurchaseManager.initialize();

      // 2. Premium status check karo App Store se
      const premiumStatus = await PurchaseManager.checkAndRestorePremium();
      isUserPremium = premiumStatus;
      console.log('👑 Premium status:', premiumStatus);

      // 3. Agar premium nahi hai tabhi ads initialize karo
      if (!premiumStatus) {
        await AdsManager.initializeAds();
        console.log('📢 Ads initialized (user is not premium)');
        adsInitialized.current = true;
      } else {
        console.log('✅ User is premium — ads skipped');
      }
    } catch (error) {
      console.log('App init error:', error);
      // Fallback: ads initialize karo
      await AdsManager.initializeAds();
      adsInitialized.current = true;
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
          <Stack.Screen name="ChecklistScreen" options={{ headerShown: false }} />
          <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="Languageselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="Themeselectionscreen" options={{ headerShown: false }} />
          <Stack.Screen name="PremiumScreen" options={{ headerShown: false }} />
          <Stack.Screen name="DrawingScreen" options={{ headerShown: false }} />
          <Stack.Screen name="Purchasesuccessscreen" options={{ headerShown: false }} />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}