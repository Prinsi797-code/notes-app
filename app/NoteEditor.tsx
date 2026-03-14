import { CategoryFilter } from '@/components/CategoryFilter';
import { ColorSelector } from '@/components/ColorSelector';
import { ImageUploader } from '@/components/ImageUploader';
import { ListLineRenderer } from '@/components/ListLineRenderer';
import { TableEditor } from '@/components/TableEditor';
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
// import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BannerAdSize,
  GAMBannerAd,
} from 'react-native-google-mobile-ads';

type ActivePanel = null | 'format' | 'color' | 'category' | 'image' | 'font' | 'more';

const FONTS: { label: string; value: string; sample: string }[] = [
  { label: 'Default', value: 'System', sample: 'The quick brown fox' },
  { label: 'Roboto', value: 'Roboto', sample: 'The quick brown fox' },
  { label: 'Lato', value: 'Lato', sample: 'The quick brown fox' },
  { label: 'Italic', value: 'Georgia', sample: 'The quick brown fox' },
  { label: 'Georgia', value: 'Georgia', sample: 'The quick brown fox' },
  { label: 'Courier', value: 'Courier New', sample: 'The quick brown fox' },
  { label: 'Palatino', value: 'Palatino', sample: 'The quick brown fox' },
  { label: 'Times New Roman', value: 'Times New Roman', sample: 'The quick brown fox' },
  { label: 'Helvetica', value: 'Helvetica', sample: 'The quick brown fox' },
  { label: 'Menlo', value: 'Menlo', sample: 'The quick brown fox' },
  { label: 'Chalkboard', value: 'Chalkboard SE', sample: 'The quick brown fox' },
  { label: 'Arial', value: 'Arial', sample: 'The quick brown fox' },
];

export default function NoteEditorModal() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const noteId = params.noteId as string | undefined;
  const { t } = useLanguage();
  const { notes, addNote, updateNote } = useNotes();
  const { images, pickImage, removeImage, setInitialImages, clearImages, loading: imageLoading } = useImagePicker();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const handleTableChange = useCallback((data: TableData) => {
    setTableData(data);
  }, []);

  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    leftBorder: false,
  });
  const [selectedFont, setSelectedFont] = useState('System');
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableData | undefined>(undefined);


  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useFocusEffect(
    useCallback(() => {
      try {
        const DS = require('./DrawingScreen').default as any;
        if (DS && DS._lastDrawingUri) {
          const uri: string = DS._lastDrawingUri;
          DS._lastDrawingUri = null;
          setInitialImages([...imagesRef.current, uri]);
        }
      } catch (_) { }
    }, [])
  );

  const panelAnim = useRef(new Animated.Value(0)).current;
  const contentRef = useRef<TextInput>(null);

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);
  useEffect(() => {
    const loadBannerConfig = async () => {
      const config = await AdsManager.getBannerConfig('note');
      if (config) setBannerConfig(config);
    };
    loadBannerConfig();
  }, []);

  useEffect(() => {
    if (noteId && notes.length > 0 && !isLoaded) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setCategory(note.category || CATEGORIES[0]);
        setTextStyle({
          bold: note.textStyle.bold,
          italic: note.textStyle.italic,
          underline: note.textStyle.underline,
          list: note.textStyle.list,
          leftBorder: note.textStyle.leftBorder ?? false,
        });
        setInitialImages(note.images || []);
        if ((note as any).fontFamily) setSelectedFont((note as any).fontFamily);
        setIsLoaded(true);
        if ((note as any).tableData) {
          setTableData((note as any).tableData);
          setShowTable(true);
        }
      }
    } else if (!noteId) {
      setTitle('');
      setContent('');
      setSelectedColor(DEFAULT_COLOR);
      setCategory(CATEGORIES[0]);
      setTextStyle({ bold: false, italic: false, underline: false, list: false, leftBorder: false });
      clearImages();
      setSelectedFont('System');
      setIsLoaded(false);
    }
  }, [noteId, notes, isLoaded]);

  const togglePanel = (panel: ActivePanel) => {
    if (activePanel === panel) {
      closePanel();
    } else {
      setActivePanel(panel);
      Animated.spring(panelAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }
  };

  const closePanel = () => {
    Animated.spring(panelAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start(() => {
      setActivePanel(null);
    });
  };

  const handleToggleTextStyle = (key: keyof TextStyle) => {
    setTextStyle(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
      fontFamily: selectedFont,
      tableData: showTable ? tableData : undefined,
    };
    try {
      if (noteId) {
        await updateNote(noteId, formData);
      } else {
        await addNote(formData);
      }
      setIsAdLoading(true);
      await AdsManager.showNoteScreenInterstitialAd('note_screen', 'save');
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
      setIsAdLoading(false);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    }
  };

  const handleCancel = async () => {
    const hasChanges = title.trim() || content.trim() || images.length > 0;
    if (hasChanges) {
      Alert.alert(
        t('home.Discardchanges'),
        t('home.unsavedchanges'),
        [
          { text: t('home.keepEditing'), style: 'cancel' },
          { text: t('home.discard'), style: 'destructive', onPress: () => showAdAndGoBack() },
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
      await AdsManager.showNoteScreenInterstitialAd('note_screen', 'back');
    } catch (error) { }
    finally {
      setIsAdLoading(false);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    }
  };

  const saveImageToGallery = async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_need'), t('please_allow_save_image'));
        return;
      }
      if (uri.startsWith('data:image')) {
        const commaIndex = uri.indexOf(',');
        if (commaIndex === -1) { Alert.alert('Error', 'Invalid drawing data.'); return; }
        const base64Data = uri.substring(commaIndex + 1);
        if (!base64Data || base64Data.length < 10) { Alert.alert('Error', 'Drawing empty.'); return; }

        const tempPath = `${FileSystem.documentDirectory}drawing_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(tempPath, base64Data, {
          encoding: 'base64' as any,
        });
        await MediaLibrary.saveToLibraryAsync(tempPath);
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => { });
      } else {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert(t('Saved!'), t('image_saved'));
    } catch (e: any) {
      console.error('saveImageToGallery error:', e);
      Alert.alert('Error', e?.message ?? 'Could not save image.');
    }
  };

  const useLineRenderer = textStyle.leftBorder || textStyle.list;

  const contentTextStyle = [
    styles.contentInput,
    {
      color: colors.textPrimary,
      fontFamily: selectedFont === 'System' ? undefined : selectedFont,
    },
    textStyle.bold && styles.boldText,
    textStyle.italic && styles.italicText,
    textStyle.underline && styles.underlineText,
  ];

  const titleTextStyle = [
    styles.titleInput,
    {
      color: colors.textPrimary,
      fontFamily: selectedFont === 'System' ? undefined : selectedFont,
    },
  ];

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const renderActivePanel = () => {
    if (!activePanel) return null;
    return (
      <Animated.View
        style={[
          styles.expandedPanel,
          {
            backgroundColor: colors.cardBackground,
            borderTopColor: colors.border,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        {activePanel === 'format' && (
          <View style={styles.panelContent}>
            <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>
              {t('model.textFormatting')}
            </Text>
            <TextFormatter textStyle={textStyle} onToggle={handleToggleTextStyle} label="" />
          </View>
        )}
        {activePanel === 'color' && (
          <View style={styles.panelContent}>
            <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>
              {t('model.noteColor')}
            </Text>
            <ColorSelector selectedColor={selectedColor} onSelectColor={setSelectedColor} label="" />
          </View>
        )}
        {activePanel === 'category' && (
          <View style={styles.panelContent}>
            <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>
              {t('model.category')}
            </Text>
            <CategoryFilter selectedCategory={category} onSelectCategory={setCategory as any} />
          </View>
        )}
        {activePanel === 'image' && (
          <View style={styles.panelContent}>
            <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>
              {t('model.attachImage')}
            </Text>
            <ImageUploader
              images={images}
              onPickImage={pickImage}
              onRemoveImage={removeImage}
              loading={imageLoading}
              label=""
            />
          </View>
        )}
        {activePanel === 'font' && (
          <View style={styles.panelContent}>
            <Text style={[styles.panelTitle, { color: colors.textSecondary }]}>
              FONT STYLE
            </Text>
            <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 160 }}>
              {FONTS.map(font => (
                <TouchableOpacity
                  key={font.value + font.label}
                  onPress={() => { setSelectedFont(font.value); closePanel(); }}
                  style={[
                    styles.fontRow,
                    selectedFont === font.value && {
                      backgroundColor: colors.primary + '18',
                      borderColor: colors.primary,
                    },
                    { borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontRowLeft}>
                    <Text style={[styles.fontSample, { fontFamily: font.value === 'System' ? undefined : font.value, color: colors.textPrimary }]}>
                      {font.sample}
                    </Text>
                    <Text style={[styles.fontName, { color: colors.textSecondary }]}>{font.label}</Text>
                  </View>
                  {selectedFont === font.value && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: 'transparent' }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton} disabled={isAdLoading || saving}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              disabled={saving || isAdLoading}
            >
              {saving ? (
                <Text style={styles.doneText}>...</Text>
              ) : (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date stamp */}
        <Text style={[styles.dateStamp, { color: colors.textTertiary }]}>
          {new Date().toLocaleDateString('en-US', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={titleTextStyle}
            placeholder={t('home.titlenot')}
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus={!noteId}
            returnKeyType="next"
            onSubmitEditing={() => contentRef.current?.focus()}
          />
          {useLineRenderer ? (
            <ListLineRenderer
              value={content}
              onChange={setContent}
              colors={colors}
              fontFamily={selectedFont}
              bold={textStyle.bold}
              italic={textStyle.italic}
              underline={textStyle.underline}
              placeholder={t('home.additem')}
              showBorder={true}
            />
          ) : (
            <TextInput
              ref={contentRef}
              style={contentTextStyle}
              placeholder={t('home.starttyping')}
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          )}
          {showTable && (
            <TableEditor
              colors={colors}
              onRemove={() => { setShowTable(false); setTableData(undefined); }}
              initialData={tableData}
              onChange={handleTableChange}
            />
          )}
          {images.length > 0 && (
            <View style={styles.imagesSection}>
              {images.map((uri, idx) => {
                const isDrawing = uri.startsWith('data:image');
                return (
                  <View key={`img-${idx}`} style={styles.imagePreviewWrapper}>
                    <View style={styles.imageTypeTag}>
                      <Ionicons
                        name={isDrawing ? 'pencil' : 'image-outline'}
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.imageTypeLabel, { color: colors.textSecondary }]}>
                        {isDrawing ? 'Drawing' : 'Image'}
                      </Text>
                    </View>
                    <Image
                      source={{ uri }}
                      style={[
                        styles.imagePreview,
                        { borderColor: colors.border },
                        isDrawing
                          ? { backgroundColor: '#000' }
                          : { backgroundColor: colors.cardBackground },
                      ]}
                      resizeMode={isDrawing ? 'contain' : 'cover'}
                    />
                    <TouchableOpacity
                      onPress={() => saveImageToGallery(uri)}
                      style={[styles.imageDeleteBtn, { backgroundColor: colors.cardBackground }]}
                    >
                      <Ionicons name="download-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 200 }} />
        </ScrollView>

        {activePanel && activePanel !== 'more' && renderActivePanel()}

        {bannerConfig?.show && (
          <View style={{ width: '100%', alignItems: 'center', backgroundColor: colors.background }}>
            <GAMBannerAd
              unitId={bannerConfig.id}
              sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          <ToolbarButton active={activePanel === 'format'} onPress={() => togglePanel('format')} colors={colors}>
            <Text style={[styles.toolbarLabel, { color: activePanel === 'format' ? colors.primary : colors.textSecondary }]}>Aa</Text>
          </ToolbarButton>

          <ToolbarButton active={activePanel === 'category'} onPress={() => togglePanel('category')} colors={colors}>
            <Ionicons name="list" size={22} color={activePanel === 'category' ? colors.primary : colors.textSecondary} />
          </ToolbarButton>
          <ToolbarButton active={showTable} onPress={() => setShowTable(v => !v)} colors={colors}>
            <Ionicons name="grid-outline" size={22} color={showTable ? colors.primary : colors.textSecondary} />
          </ToolbarButton>
          <ToolbarButton active={activePanel === 'color'} onPress={() => togglePanel('color')} colors={colors}>
            <Ionicons name="color-palette-outline" size={22} color={activePanel === 'color' ? colors.primary : colors.textSecondary} />
          </ToolbarButton>

          <ToolbarButton active={activePanel === 'image'} onPress={() => togglePanel('image')} colors={colors}>
            <Ionicons name="attach" size={22} color={activePanel === 'image' ? colors.primary : colors.textSecondary} />
          </ToolbarButton>

          <ToolbarButton active={activePanel === 'font'} onPress={() => togglePanel('font')} colors={colors}>
            <Text style={[styles.fontToolbarLabel, { color: activePanel === 'font' ? colors.primary : colors.textSecondary }]}>F</Text>
          </ToolbarButton>

          <ToolbarButton
            active={false}
            onPress={() => router.push({ pathname: '/DrawingScreen', params: noteId ? { noteId } : {} })}
            colors={colors}
          >
            <View style={styles.pencilBtnWrapper}>
              <Ionicons name="brush-outline" size={22} color={colors.textSecondary} />
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={8} color="#fff" />
              </View>
            </View>
          </ToolbarButton>

          <ToolbarButton active={false} onPress={() => { if (activePanel) closePanel(); }} colors={colors}>
            <Ionicons name="chevron-down" size={22} color={activePanel ? colors.primary : colors.textTertiary} />
          </ToolbarButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ToolbarButton({
  children, active, onPress, colors,
}: {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toolbarBtn, active && { backgroundColor: colors.primary + '18' }]}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 10, paddingBottom: 4,
  },
  headerButton: { padding: 0, minWidth: 44 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  doneButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  doneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dateStamp: { textAlign: 'center', fontSize: 13, paddingBottom: 8, fontWeight: '400' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  titleInput: { fontSize: 26, fontWeight: '700', lineHeight: 34, marginBottom: 12, padding: 0 },
  contentInput: { fontSize: 17, lineHeight: 26, minHeight: 300, padding: 0, textAlignVertical: 'top' },
  boldText: { fontWeight: '700' },
  italicText: { fontStyle: 'italic' },
  underlineText: { textDecorationLine: 'underline' },
  expandedPanel: { borderTopWidth: StyleSheet.hairlineWidth, maxHeight: 260 },
  panelContent: { padding: 16 },
  panelTitle: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12,
  },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6, paddingHorizontal: 4, marginTop: 10
  },
  toolbarBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, marginHorizontal: 2,
  },
  toolbarLabel: { fontSize: 17, fontWeight: '600', letterSpacing: -0.5 },
  fontToolbarLabel: { fontSize: 18, fontWeight: '700', fontStyle: 'italic', letterSpacing: -0.5 },
  pencilBtnWrapper: { position: 'relative', width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  premiumBadge: {
    position: 'absolute', top: -4, right: -5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FF9F0A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  fontRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6,
  },
  fontRowLeft: { flex: 1, gap: 2 },
  fontSample: { fontSize: 15, lineHeight: 20 },
  fontName: { fontSize: 11, fontWeight: '500' },
  // ── Images section ──
  imagesSection: { marginTop: 16 },
  imagePreviewWrapper: { position: 'relative', marginBottom: 16 },
  imageTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  imageTypeLabel: { fontSize: 12, fontWeight: '600' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12, borderWidth: 1 },
  imageDeleteBtn: {
    position: 'absolute', top: 8, right: 8, borderRadius: 11,
    padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
});