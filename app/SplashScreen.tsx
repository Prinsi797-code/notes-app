import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StyleSheet,
    View
} from 'react-native';
import AdsManager from '../services/adsManager';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [adAttempted, setAdAttempted] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;

  const navigateToHome = () => {
    router.replace('/(tabs)');
  };

  const runAdFlow = async () => {
    try {
      console.log('🚀 Initializing ads for splash...');
      await AdsManager.initializeAds();

      console.log('🎯 Attempting to show splash ad...');
      const adShown = await AdsManager.showSplashAd();

      if (adShown) {
        console.log('✅ Splash ad shown and closed. Navigating to home...');
      } else {
        console.log('⏭️ No splash ad shown. Navigating to home...');
      }
    } catch (error) {
      console.log('❌ Ad flow error:', error);
    } finally {
      navigateToHome();
    }
  };

  useEffect(() => {
    // Background pulse animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle2, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle2, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Title fade in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Loader bar animation
    Animated.timing(loaderWidth, {
      toValue: 1,
      duration: 2800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Start ad flow after animations settle
    const timer = setTimeout(() => {
      setAdAttempted(true);
      runAdFlow();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const bgCircle1Scale = bgCircle1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const bgCircle2Scale = bgCircle2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const loaderWidthInterpolated = loaderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <Animated.View
        style={[
          styles.bgCircle1,
          { transform: [{ scale: bgCircle1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle2,
          { transform: [{ scale: bgCircle2Scale }] },
        ]}
      />
      <View style={styles.bgCircle3} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Replace with your actual logo Image */}
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />

          {/* Placeholder logo — replace with your Image */}
          {/* <View style={styles.logoPlaceholder}>
            <Text style={styles.logoIcon}>📝</Text>
          </View> */}

          {/* Glow ring */}
          <View style={styles.glowRing} />
        </Animated.View>

        {/* App name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {/* NoteKeep */}
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[styles.tagline, { opacity: subtitleOpacity }]}
        >
          {/* Your thoughts, organized */}
        </Animated.Text>
      </View>

      {/* Bottom loader */}
      <View style={styles.loaderContainer}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[styles.loaderBar, { width: loaderWidthInterpolated }]}
          />
        </View>
        <Animated.Text style={[styles.loaderText, { opacity: subtitleOpacity }]}>
          Loading...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ede9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Background decorative circles
  bgCircle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#f5e1b5',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#f5e1b5',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
//   bgCircle3: {
//     position: 'absolute',
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     backgroundColor: '#f2d38f',
//     top: height * 0.35,
//     left: width * 0.3,
//   },

  // Content
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 28,
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    // borderRadius: 24,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  logoIcon: {
    fontSize: 44,
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    // borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'transparent',
  },

  // Text
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    fontWeight: '400',
  },

  // Loader
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  loaderTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  loaderBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#e39836',
    shadowColor: '#e39836',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  loaderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});