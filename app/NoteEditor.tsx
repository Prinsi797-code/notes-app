import { CategoryFilter } from '@/components/CategoryFilter';
import { ColorSelector } from '@/components/ColorSelector';
import { ImageUploader } from '@/components/ImageUploader';
import { TextFormatter } from '@/components/TextFormatter';
import { CATEGORIES } from '@/constants/Categories';
import { DEFAULT_COLOR } from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useNotes } from '@/hooks/useNotes';
import AdsManager from '@/services/adsManager';
import { NoteFormData, TextStyle } from '@/types/Note';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    BannerAdSize,
    GAMBannerAd,
} from 'react-native-google-mobile-ads';

export default function NoteEditorModal() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const noteId = params.noteId as string | undefined;
  const { t } = useLanguage();
  const { notes, addNote, updateNote } = useNotes();
  const { images, pickImage, removeImage, setInitialImages, clearImages, loading: imageLoading } = useImagePicker();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // Banner ad config
  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);

  // Load banner config
  useEffect(() => {
    const config = AdsManager.getBannerConfig('note');
    console.log('📢 Note screen banner config:', config);
    if (config) setBannerConfig(config);
  }, []);

  // Load existing note if editing
  useEffect(() => {
    console.log('Modal effect triggered, noteId:', noteId, 'Total notes:', notes.length);

    if (noteId && notes.length > 0 && !isLoaded) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setTextStyle(note.textStyle);
        setInitialImages(note.images);
        setIsLoaded(true);
        console.log('✅ Note loaded:', note.title);
      } else {
        console.log('❌ Note not found');
      }
    } else if (!noteId) {
      setTitle('');
      setContent('');
      setSelectedColor(DEFAULT_COLOR);
      setCategory(CATEGORIES[0]);
      setTextStyle({ bold: false, italic: false, underline: false, list: false });
      clearImages();
      setIsLoaded(false);
    }
  }, [noteId, notes, isLoaded]);

  const handleToggleTextStyle = (key: keyof TextStyle) => {
    setTextStyle(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Save — note save karo, phir note_screen inter ad
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your note');
      return;
    }
    if (isAdLoading) return;

    setSaving(true);
    const formData: NoteFormData = {
      title: title.trim(),
      content: content.trim(),
      color: selectedColor,
      category,
      images,
      textStyle,
    };

    try {
      if (noteId) {
        const result = await updateNote(noteId, formData);
        console.log('Update result:', result ? 'SUCCESS' : 'FAILED');
      } else {
        const result = await addNote(formData);
        console.log('Create result:', result);
      }

      // ✅ Note saved — ab ad show karo
      setIsAdLoading(true);
      console.log('💾 Note save pressed — attempting ad...');
      await AdsManager.showNoteScreenInterstitialAd('note_screen', 'save');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
      setIsAdLoading(false);
      // Ad close ho ya fail ho — wapas jao
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  // ✅ Cancel/Close — note_screen inter ad, phir back
  const handleCancel = async () => {
    const hasChanges = title.trim() || content.trim() || images.length > 0;

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => showAdAndGoBack(),
          },
        ]
      );
    } else {
      await showAdAndGoBack();
    }
  };

  const showAdAndGoBack = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    try {
      console.log('⬅️ Note cancel/back pressed — attempting ad...');
      await AdsManager.showNoteScreenInterstitialAd('note_screen', 'back');
    } catch (error) {
      console.log('❌ Note back ad error:', error);
    } finally {
      setIsAdLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  const contentTextStyle = [
    styles.contentInput,
    {
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    textStyle.bold && styles.boldText,
    textStyle.italic && styles.italicText,
    textStyle.underline && styles.underlineText,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerButton}
            disabled={isAdLoading || saving}
          >
            <Ionicons
              name="close"
              size={28}
              color={isAdLoading ? colors.textSecondary : colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {noteId ? t('model.editNote') : t('model.newnote')}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving || isAdLoading}
          >
            {saving ? (
              <Text style={[styles.savingText, { color: colors.textSecondary }]}>
                Saving...
              </Text>
            ) : (
              <Ionicons
                name="checkmark"
                size={28}
                color={isAdLoading ? colors.textSecondary : colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <TextInput
            style={[
              styles.titleInput,
              { color: colors.textPrimary, borderBottomColor: colors.primary },
            ]}
            placeholder={t('model.noteTitle')}
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus={!noteId}
            returnKeyType="next"
          />

          {/* Category Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {t('model.category')}
          </Text>
          <CategoryFilter
            selectedCategory={category}
            onSelectCategory={setCategory as any}
          />

          {/* Color Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {t('model.noteColor')}
          </Text>
          <ColorSelector
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            label=""
          />

          {bannerConfig?.show && (
            <View style={[styles.stickyAdContainer, { backgroundColor: colors.background }]}>
              <GAMBannerAd
                unitId={bannerConfig.id}
                sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                onAdLoaded={() => console.log('✅ Note Banner Ad Loaded')}
                onAdFailedToLoad={(error) => console.log('❌ Note Banner Ad Failed:', error)}
              />
            </View>
          )}

          {/* Text Formatter */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {t('model.textFormatting')}
          </Text>
          <TextFormatter
            textStyle={textStyle}
            onToggle={handleToggleTextStyle}
            label=""
          />
          
          {/* Content Input */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {t('model.content')}
          </Text>
          <TextInput
            style={contentTextStyle}
            placeholder={
              textStyle.list ? t('model.itemsList') : t('model.writeNote')
            }
            placeholderTextColor={colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Image Uploader */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            {t('model.attachImage')}
          </Text>
          <ImageUploader
            images={images}
            onPickImage={pickImage}
            onRemoveImage={removeImage}
            loading={imageLoading}
            label=""
          />

          <View style={styles.bottomSpacer} />

        </ScrollView>

        {/* ✅ Banner Ad — bilkul bottom mein */}
        {/* {bannerConfig?.show && (
          <View style={[styles.bannerContainer, { backgroundColor: colors.background }]}>
            <GAMBannerAd
              unitId={bannerConfig.id}
              sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              onAdLoaded={() => console.log('✅ Note Banner Ad Loaded')}
              onAdFailedToLoad={(error) => console.log('❌ Note Banner Ad Failed:', error)}
            />
          </View>
        )} */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  stickyAdContainer: {

    width: '100%',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  savingText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 180,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: 80,
  },
});