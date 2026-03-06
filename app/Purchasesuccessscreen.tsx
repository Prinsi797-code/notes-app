import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function PurchaseSuccessScreen() {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const btnSlide    = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    // Crown pop
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Text fade + slide
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Button slide up
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(btnSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Crown Icon */}
      <Animated.View style={[styles.crownWrap, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.crownOuter}>
          <View style={styles.crownInner}>
            <Ionicons name="gift" size={64} color="#faab00" />
          </View>
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <Text style={styles.title}>Purchase Successful!</Text>
        </View>
        <Text style={styles.subtitle}>Welcome to Premium!</Text>
        <Text style={styles.subtitle}>All ads have been removed.</Text>
      </Animated.View>

      {/* Go to Home Button */}
      <Animated.View
        style={[styles.btnWrap, { transform: [{ translateY: btnSlide }] }]}
      >
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.btnText}>Go to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownWrap: {
    marginBottom: 40,
  },
  crownOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(250,171,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(250,171,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  btnWrap: {
    position: 'absolute',
    bottom: 36,
    width: width - 40,
  },
  btn: {
    backgroundColor: '#faab00',
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#faab00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});