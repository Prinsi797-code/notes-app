import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';

import AdsManager from '@/services/adsManager';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function SettingsScreen() {
  const { isDarkMode, themeMode } = useTheme();
  const { t, locale } = useLanguage();
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleGoBack = async () => {
    if (isAdLoading) return; // Double tap prevention
    setIsAdLoading(true);

    try {
      console.log('⬅️ Settings back pressed — attempting ad...');
      await AdsManager.showSettingScreenInterstitialAd('back');
    } catch (error) {
      console.log('❌ Settings ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back(); // Ad show ho ya na ho — wapas jaao
    }
  };

  const handleThemePress = () => {
    router.push('/Themeselectionscreen');
  };

  const handleLanguagePress = () => {
    router.push('/Languageselectionscreen');
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'Light':
        return t('home.light');
      case 'Dark':
        return t('home.dark');
      case 'System':
        return t('home.system');
      default:
        return t('home.light');
    }
  };

  const languageNames: any = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    pt: 'Português',
    ru: 'Русский',
    ko: '한국어',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    id: 'Indonesia',
    zh: '中文',
    hi: 'हिंदी',
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          disabled={isAdLoading} // Ad load hote waqt disable
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? '#fff' : '#1a1a1a'}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            isDarkMode && styles.darkText,
            { marginLeft: 12 }
          ]}
        >
          {t('home.settings')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personalization Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('home.personalization')}
          </Text>

          {/* Language */}
          <View style={[styles.settingCard, isDarkMode && styles.darkCard]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLanguagePress}
              activeOpacity={0.6}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#6200EE15' }]}>
                  <Ionicons name="language" size={22} color="#6200EE" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>
                    {t('home.language')}
                  </Text>
                  <Text style={[styles.settingSubtitle, isDarkMode && styles.darkSubtitle]}>
                    {languageNames[locale]}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* App Theme */}
          <View style={[styles.settingCard, isDarkMode && styles.darkCard, { marginTop: 12 }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleThemePress}
              activeOpacity={0.6}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF6F0015' }]}>
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={22}
                    color="#FF6F00"
                  />
                </View>
                <View>
                  <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>
                    {t('home.theme')}
                  </Text>
                  <Text style={[styles.settingSubtitle, isDarkMode && styles.darkSubtitle]}>
                    {getThemeLabel()}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('home.about')}
          </Text>
          <View style={[styles.settingCard, isDarkMode && styles.darkCard]}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.6}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#00BCD415' }]}>
                  <Ionicons name="information-circle" size={22} color="#00BCD4" />
                </View>
                <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>
                  {t('home.appversion')}
                </Text>
              </View>
              <Text style={[styles.versionText, isDarkMode && styles.darkSubtitle]}>
                1.0.0
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },

  darkHeader: {
    // backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  darkSubtitle: {
    color: '#999',
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});