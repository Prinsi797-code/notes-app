import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BannerAdSize,
  GAMBannerAd
} from 'react-native-google-mobile-ads';

type ThemeMode = 'Light' | 'Dark' | 'System';

export default function ThemeSelectionScreen() {
  const { colors, themeMode: currentTheme, setThemeMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(currentTheme);
  const { t } = useLanguage();
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleGoBack = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
     await AdsManager.showSettingScreenInterstitialAd('setting_screen', 'back');
    try {
      console.log('Theme back pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('back');
    } catch (error) {
      console.log('Theme back ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back();
       await AdsManager.showSettingScreenInterstitialAd('setting_screen', 'back');
    }
  };

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('setting');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  const handleSave = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    // await AdsManager.showSettingScreenInterstitialAd('setting_screen', 'save');
    try {
      await setThemeMode(selectedTheme);
      console.log('Theme save pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('save');
    } catch (error) {
      console.log('Theme save ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back();
    }
  };

  const handleThemeSelect = (theme: ThemeMode) => {
    setSelectedTheme(theme);
  };

  const themes: { mode: ThemeMode; icon: string }[] = [
    { mode: 'Light', icon: 'sunny' },
    { mode: 'Dark', icon: 'moon' },
    { mode: 'System', icon: 'phone-portrait' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground, flex: 1 }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          disabled={isAdLoading}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('home.selecttheme')}
        </Text>

        <View style={{ flex: 1 }} />

        {/* <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isAdLoading}
        >
          <Ionicons
            name="checkmark"
            size={24}
            color={isAdLoading ? colors.textSecondary : colors.primary}
          />
        </TouchableOpacity> */}


        <TouchableOpacity
          onPress={handleSave}
          disabled={isAdLoading}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          {isAdLoading
            ? <Text style={[styles.saveButtonText, { color: isAdLoading ? colors.textSecondary : colors.primary }]}>...</Text>
            : <Ionicons name="checkmark" size={20} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Mode Label */}
        <View style={[styles.content, { flex: 1 }]}>
        <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
          {t('home.mode')}
        </Text>

        {/* Theme Cards Grid */}
        <View style={styles.themeGrid}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.mode}
              style={[
                styles.themeCard,
                {
                  backgroundColor: colors.background,
                  borderColor: selectedTheme === theme.mode ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => handleThemeSelect(theme.mode)}
              activeOpacity={0.7}
              disabled={isAdLoading}
            >
              {/* Preview Container */}
              <View style={styles.previewContainer}>
                {theme.mode === 'Light' && (
                  <View style={styles.lightPreview}>
                    <View style={styles.previewHeader} />
                    <View style={styles.previewContent}>
                      <View style={styles.previewLine} />
                      <View style={[styles.previewLine, { width: '80%' }]} />
                      <View style={[styles.previewLine, { width: '60%' }]} />
                    </View>
                    <View style={styles.previewIcon}>
                      <Ionicons name="sunny" size={20} color="#FFA000" />
                    </View>
                  </View>
                )}
                {theme.mode === 'Dark' && (
                  <View style={styles.darkPreview}>
                    <View style={styles.previewHeaderDark} />
                    <View style={styles.previewContent}>
                      <View style={styles.previewLineDark} />
                      <View style={[styles.previewLineDark, { width: '80%' }]} />
                      <View style={[styles.previewLineDark, { width: '60%' }]} />
                    </View>
                    <View style={styles.previewIcon}>
                      <Ionicons name="moon" size={20} color="#FFA000" />
                    </View>
                  </View>
                )}
                {theme.mode === 'System' && (
                  <View style={styles.systemPreview}>
                    <View style={styles.systemPreviewLeft}>
                      <View style={styles.previewHeader} />
                      <View style={styles.previewContent}>
                        <View style={styles.previewLine} />
                        <View style={[styles.previewLine, { width: '70%' }]} />
                      </View>
                    </View>
                    <View style={styles.systemPreviewRight}>
                      <View style={styles.previewHeaderDark} />
                      <View style={styles.previewContent}>
                        <View style={styles.previewLineDark} />
                        <View style={[styles.previewLineDark, { width: '70%' }]} />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Theme Label */}
              <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>
                {t(`home.${theme.mode.toLowerCase()}`) || theme.mode}
              </Text>

              {/* Radio Button */}
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selectedTheme === theme.mode ? colors.primary : colors.border },
                  ]}
                >
                  {selectedTheme === theme.mode && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {bannerConfig?.show && (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            backgroundColor: colors.cardBackground,
          }}
        >
          <GAMBannerAd
            unitId={bannerConfig.id}
            sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    // borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    paddingLeft: 10,
    fontWeight: '600',
  },
  saveButton: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'
    // width: 60,
  },
  content: {
    padding: 16,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  previewContainer: {
    width: '100%',
    height: 100,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lightPreview: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  darkPreview: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
  },
  systemPreview: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  systemPreviewLeft: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  systemPreviewRight: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  previewHeader: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 6,
  },
  previewHeaderDark: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 6,
  },
  previewContent: {
    flex: 1,
    gap: 4,
  },
  previewLine: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    width: '100%',
  },
  previewLineDark: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    width: '100%',
  },
  previewIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  radioContainer: {
    marginTop: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});