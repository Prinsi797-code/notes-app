import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from 'expo-iap';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PurchaseManager, { SUBSCRIPTION_SKUS } from '../services/purchaseManager';

const { width } = Dimensions.get('window');
type PlanKey = 'yearly' | 'weekly' | 'monthly';

interface Plan {
  key: PlanKey;
  sku: string;
  label: string;
  fallbackPrice: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  discount: string;
  discountLabel: string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'yearly',
    sku: SUBSCRIPTION_SKUS.yearly,
    label: 'Yearly',
    fallbackPrice: '₹3,500',
    sub: 'Best annual deal',
    badge: 'Best value',
    badgeColor: '#faab00',
    discount: '80% OFF',
    discountLabel: '',
    highlight: true,
  },
  {
    key: 'monthly',
    sku: SUBSCRIPTION_SKUS.monthly,
    label: 'Monthly',
    fallbackPrice: '₹850',
    sub: 'Per month',
    discount: '76% OFF',
    discountLabel: 'Recommend',
    highlight: false,
  },
  {
    key: 'weekly',
    sku: SUBSCRIPTION_SKUS.weekly,
    label: 'Weekly',
    fallbackPrice: '₹250',
    sub: 'Per week',
    discount: '39% OFF',
    discountLabel: 'Most Popular',
    highlight: false,
  },
];

export default function PremiumScreen() {
  const { isDarkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('yearly');
  const [products, setProducts] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bg          = isDarkMode ? '#0D0D0D' : '#ffffff';
  const cardBg      = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const textSecondary = isDarkMode ? '#AAAAAA' : '#666666';
  const accent = '#faab00';

  useEffect(() => {
    initAndLoad();
    return () => { PurchaseManager.removeListeners(); };
  }, []);

  const initAndLoad = async () => {
    try {
      setLoading(true);
      await PurchaseManager.initialize();

      PurchaseManager.setCallbacks(
        (_productId) => {
          setPurchasing(false);
          Alert.alert('🎉 Premium Activated!', 'All ads removed. Enjoy!', [
            { text: 'Great!', onPress: () => router.back() },
          ]);
        },
        (error) => {
          setPurchasing(false);
          Alert.alert('Purchase Failed', error || 'Something went wrong.');
        }
      );

      const subs = await PurchaseManager.getSubscriptionProducts();
      const map: Record<string, Subscription> = {};
      subs.forEach((s) => { map[s.productId] = s; });
      setProducts(map);
    } catch (err) {
      console.log('initAndLoad error:', err);
    } finally {
      setLoading(false);
    }
  };

  // App Store se real price, fallback static
  const getPriceForPlan = (plan: Plan): string => {
    const p = products[plan.sku];
    return (p as any)?.localizedPrice ?? (p as any)?.price ?? plan.fallbackPrice;
  };

  const handleSubscribe = useCallback(async () => {
    const selected = PLANS.find((p) => p.key === selectedPlan);
    if (!selected) return;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setPurchasing(true);
    try {
      await PurchaseManager.purchaseSubscription(selected.sku);
    } catch {
      setPurchasing(false);
    }
  }, [selectedPlan, scaleAnim]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await PurchaseManager.checkAndRestorePremium();
      if (restored) {
        Alert.alert('✅ Restored!', 'Premium has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Not Found', 'No active subscription found for this Apple ID.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Image source={require('../assets/images/Frame.png')} style={styles.heroImage} resizeMode="cover" />
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <View style={[styles.closeBtnCircle, {
              backgroundColor: isDarkMode ? 'rgba(42,42,42,0.85)' : 'rgba(240,240,240,0.85)'
            }]}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </View>
          </TouchableOpacity>
          <View style={styles.titleOverlay}>
            <Text style={styles.titleOverlayText}>Remove ads and unlock premium features.</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={accent} />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Loading plans...</Text>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(plan.key)}
                style={[styles.planCard, {
                  backgroundColor: isSelected ? (isDarkMode ? '#2A1A1A' : '#fffaf0') : cardBg,
                  borderColor: isSelected ? accent : (isDarkMode ? '#333' : '#eeeeee'),
                  borderWidth: isSelected ? 2 : 1,
                }]}
              >
                {plan.badge && (
                  <View style={[styles.badge, { backgroundColor: plan.badgeColor }]}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <View style={styles.planRow}>
                  <View style={[styles.radio, { borderColor: isSelected ? accent : (isDarkMode ? '#555' : '#CCC') }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: accent }]} />}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planLabel, { color: textPrimary }]}>
                      {plan.label} : {getPriceForPlan(plan)}
                    </Text>
                    <Text style={[styles.planSub, { color: textSecondary }]}>{plan.sub}</Text>
                  </View>
                  <View style={styles.discountBox}>
                    {plan.highlight ? (
                      <View style={[styles.discountPill, { backgroundColor: accent }]}>
                        <Text style={styles.discountPillText}>{plan.discount}</Text>
                      </View>
                    ) : (
                      <View style={styles.discountTextBox}>
                        <Text style={[styles.discountText, { color: textPrimary }]}>{plan.discount}</Text>
                        <Text style={[styles.discountLabel, { color: textSecondary }]}>{plan.discountLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subscribe Button */}
        <Animated.View style={[styles.subscribeWrap, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.subscribeBtn, { backgroundColor: accent, opacity: purchasing ? 0.7 : 1 }]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={purchasing || loading}
          >
            {purchasing
              ? <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
              : <Ionicons name="diamond" size={18} color="#FFF" style={{ marginRight: 8 }} />
            }
            <Text style={styles.subscribeBtnText}>
              {purchasing ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Restore */}
        {/* <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring
            ? <ActivityIndicator color={textSecondary} size="small" />
            : <Text style={[styles.restoreText, { color: textSecondary }]}>Restore Purchases</Text>
          }
        </TouchableOpacity> */}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: textSecondary }]}>Terms and Conditions</Text>
          </TouchableOpacity>
          <View style={[styles.footerDivider, { backgroundColor: textSecondary }]} />
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: textSecondary }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* <Text style={[styles.disclaimer, { color: textSecondary }]}>
          Subscription renews automatically unless canceled 24 hours before period end.
          Manage in App Store account settings.
        </Text> */}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 0 },
  heroSection: { width, height: 280, position: 'relative', marginBottom: 40 },
  heroImage: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 48, left: 16, zIndex: 10 },
  closeBtnCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  titleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 40 },
  titleOverlayText: { fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 28, marginTop: 10, color: '#383838' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  loadingText: { fontSize: 13 },
  plansContainer: { gap: 12, marginBottom: 40, paddingHorizontal: 20 },
  planCard: { borderRadius: 16, padding: 16, paddingTop: 20, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  badge: { position: 'absolute', top: -12, left: 16, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 15, fontWeight: '600' },
  planSub: { fontSize: 12, marginTop: 2 },
  discountBox: { alignItems: 'flex-end' },
  discountPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  discountPillText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  discountTextBox: { alignItems: 'flex-end' },
  discountText: { fontSize: 14, fontWeight: '700' },
  discountLabel: { fontSize: 11, marginTop: 2 },
  subscribeWrap: { marginBottom: 16, paddingHorizontal: 20 },
  subscribeBtn: { borderRadius: 50, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#faab00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  subscribeBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginBottom: 20 },
  restoreText: { fontSize: 14, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  footerLink: { fontSize: 13, textDecorationLine: 'underline' },
  footerDivider: { width: 1, height: 14, opacity: 0.4 },
  disclaimer: { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, lineHeight: 16, marginBottom: 10 },
});