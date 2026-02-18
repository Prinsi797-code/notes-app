import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: any;
}

export default function LanguageSelectionScreen() {
  const { colors, isDarkMode } = useTheme();
  const { t, locale, changeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: require('@/assets/flags/en.png') },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: require('@/assets/flags/es.png') },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: require('@/assets/flags/fr.png') },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: require('@/assets/flags/pt.png') },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: require('@/assets/flags/ru.png') },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: require('@/assets/flags/ko.png') },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: require('@/assets/flags/de.png') },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: require('@/assets/flags/it.png') },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: require('@/assets/flags/ja.png') },
    { code: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: require('@/assets/flags/id.png') },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: require('@/assets/flags/zh.png') },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: require('@/assets/flags/hi.png') },
  ];

  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

  // ✅ Back button — ad show karo phir back jao
  const handleGoBack = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      console.log('⬅️ Language back pressed — attempting ad...');
      await AdsManager.showLanguageScreenInterstitialAd('back');
    } catch (error) {
      console.log('❌ Language back ad error:', error);
    } finally {
      setIsAdLoading(false);
      router.back();
    }
  };

  // ✅ Save button — pehle language save karo, phir ad show karo, phir back jao
  const handleSave = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      // Step 1: Language save karo
      await changeLanguage(selectedLanguage);

      const successMsg = t('language.success') || 'Language changed successfully!';
      const successTitle = t('language.successTitle') || 'Success';
      Alert.alert(successTitle, successMsg);

      // Step 2: Ad show karo
      console.log('💾 Language save pressed — attempting ad...');
      await AdsManager.showLanguageScreenInterstitialAd('save');
    } catch {
      const errorMsg = t('language.error') || 'Failed to change language';
      const errorTitle = t('language.errorTitle') || 'Error';
      Alert.alert(errorTitle, errorMsg);
    } finally {
      setIsAdLoading(false);
      setTimeout(() => router.back(), 100);
    }
  };

  const handleLanguageSelect = (code: string) => setSelectedLanguage(code);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>

        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.iconButton}
          disabled={isAdLoading}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('home.language')}
        </Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handleSave}
          style={styles.iconButton}
          disabled={isAdLoading}
        >
          <Text style={[
            styles.saveButtonText,
            { color: isAdLoading ? colors.textSecondary : colors.primary }
          ]}>
            {isAdLoading ? '...' : t('home.save')}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Language List */}
      <ScrollView style={styles.content}>
        <View style={[
          styles.languageList,
          {
            backgroundColor: colors.background,
            shadowColor: isDarkMode ? '#000' : '#aaa',
          }
        ]}>
          {languages.map((lang, index) => (
            <View key={lang.code}>
              <TouchableOpacity
                style={styles.languageItem}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.6}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image
                    source={lang.flag}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      marginRight: 12,
                    }}
                  />
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, { color: colors.textPrimary }]}>
                      {lang.name}
                    </Text>
                    <Text style={[styles.nativeName, { color: colors.textSecondary }]}>
                      {lang.nativeName}
                    </Text>
                  </View>
                </View>

                <View style={[
                  styles.radioOuter,
                  { borderColor: selectedLanguage === lang.code ? colors.primary : colors.border }
                ]}>
                  {selectedLanguage === lang.code && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>

              {index < languages.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: 4,
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    // marginLeft: 10,   // 👈 spacing after back button
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  languageList: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nativeName: {
    fontSize: 13,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});