import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

type PlanKey = 'yearly' | 'weekly' | 'monthly';

interface Plan {
  key: PlanKey;
  label: string;
  price: string;
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
    label: 'Yearly',
    price: '₹3,500',
    sub: '₹3500 per',
    badge: 'Best value',
    badgeColor: '#faab00',
    discount: '80% OFF',
    discountLabel: '',
    highlight: true,
  },
  {
    key: 'monthly',
    label: 'Monthly',
    price: '₹850',
    sub: '₹212 per week',
    discount: '76% OFF',
    discountLabel: 'Recommend',
    highlight: false,
  },
  {
    key: 'weekly',
    label: 'weekly',
    price: '₹2,100',
    sub: '₹43 per week',
    discount: '39% OFF',
    discountLabel: 'Most Popular',
    highlight: false,
  },
];

const FEATURES = [
  { icon: 'infinite', text: 'Unlimited Notes' },
  { icon: 'image', text: 'Image Attachments' },
  { icon: 'color-palette', text: 'All Themes & Colors' },
  { icon: 'cloud-upload', text: 'Cloud Backup' },
  { icon: 'lock-closed', text: 'No Ads Forever' },
  { icon: 'star', text: 'Priority Support' },
];

export default function PremiumScreen() {
  const { colors, isDarkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('lifetime');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSubscribe = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      console.log('Subscribe pressed for plan:', selectedPlan);
    });
  };

  const bg = isDarkMode ? '#0D0D0D' : '#ffffff';
  const cardBg = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1A1A1A';
  const textSecondary = isDarkMode ? '#AAAAAA' : '#666666';
  const accentRed = '#faab00';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero Section - Full width image with overlaid content */}
        <View style={styles.heroSection}>
          <Image
            source={require('../assets/images/Frame.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Floating Close Button over image */}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <View style={[styles.closeBtnCircle, { backgroundColor: isDarkMode ? 'rgba(42,42,42,0.85)' : 'rgba(240,240,240,0.85)' }]}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Title overlaid at bottom of image */}
          <View style={styles.titleOverlay}>
            <Text style={styles.titleOverlayText}>
              {/* Get Unlimited access{'\n'}& Ads Remove */}
              Remove ads and unlock premium features.
            </Text>
          </View>
        </View>

        {/* Features row */}
        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuresRow}
        >
          {FEATURES.map((f) => (
            <View key={f.icon} style={[styles.featureChip, { backgroundColor: isDarkMode ? '#222' : '#FFF3F3', borderColor: isDarkMode ? '#333' : '#FFE0E0' }]}>
              <Ionicons name={f.icon as any} size={14} color={accentRed} />
              <Text style={[styles.featureText, { color: textPrimary }]}>{f.text}</Text>
            </View>
          ))}
        </ScrollView> */}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(plan.key)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isSelected
                      ? (isDarkMode ? '#2A1A1A' : '#ffffff')
                      : cardBg,
                    borderColor: isSelected ? accentRed : (isDarkMode ? '#333' : '#ffffff'),
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {plan.badge && (
                  <View style={[styles.badge, { backgroundColor: plan.badgeColor }]}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.planRow}>
                  <View style={[styles.radio, { borderColor: isSelected ? accentRed : (isDarkMode ? '#555' : '#CCC') }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: accentRed }]} />}
                  </View>

                  <View style={styles.planInfo}>
                    <Text style={[styles.planLabel, { color: textPrimary }]}>
                      {plan.label} : {plan.price}
                    </Text>
                    <Text style={[styles.planSub, { color: textSecondary }]}>{plan.sub}</Text>
                  </View>

                  <View style={styles.discountBox}>
                    {plan.highlight ? (
                      <View style={[styles.discountPill, { backgroundColor: accentRed }]}>
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
            style={[styles.subscribeBtn, { backgroundColor: accentRed }]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
          >
            <Ionicons name="diamond" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer links */}
        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: textSecondary }]}>Terms and Conditions</Text>
          </TouchableOpacity>
          <View style={[styles.footerDivider, { backgroundColor: textSecondary }]} />
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: textSecondary }]}>Privacy policy</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 0 },

  // Hero - full width, no horizontal padding
  heroSection: {
    width: width,
    height: 280,
    position: 'relative',
    marginBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Floating close button - top left over image
  closeBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  closeBtnCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Title overlay at bottom of image
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 40,
    // Gradient-like fade from transparent to bg color
    background: 'transparent',
  },
  titleOverlayText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: 10,
    color: '#383838',
  },

  // Features
  featuresRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 8 },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  featureText: { fontSize: 12, fontWeight: '500' },

  // Plans
  plansContainer: { gap: 12, marginBottom: 40, paddingHorizontal: 20 },
  planCard: {
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 15, fontWeight: '600' },
  planSub: { fontSize: 12, marginTop: 2 },
  discountBox: { alignItems: 'flex-end' },
  discountPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountPillText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  discountTextBox: { alignItems: 'flex-end' },
  discountText: { fontSize: 14, fontWeight: '700' },
  discountLabel: { fontSize: 11, marginTop: 2 },

  // Subscribe
  subscribeWrap: { marginBottom: 30, paddingHorizontal: 20 },
  subscribeBtn: {
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
  subscribeBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  footerLink: { fontSize: 13, textDecorationLine: 'underline' },
  footerDivider: { width: 1, height: 14, opacity: 0.4 },
});