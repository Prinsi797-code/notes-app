import { CategoryFilter } from '@/components/CategoryFilter';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useNotes } from '@/hooks/useNotes';
import AdsManager from '@/services/adsManager';
import { Note } from '@/types/Note';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  BannerAdSize,
  GAMBannerAd
} from 'react-native-google-mobile-ads';

export default function NotesScreen() {
  const { colors } = useTheme();
  const { notes, loading, deleteNote, togglePin, refreshNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const [layoutMode, setLayoutMode] = useState<'single' | 'double'>('single');

  const [fabOpen, setFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  const [bannerConfig, setBannerConfig] = useState<{ show: boolean; id: string } | null>(null);

  useEffect(() => {
    const config = AdsManager.getBannerConfig('main');
    if (config) setBannerConfig(config);
  }, []);

  useEffect(() => {
    console.log('📝 Notes list updated:', notes.length, 'notes');
  }, [notes]);

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [])
  );

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, { toValue, useNativeDriver: true, tension: 60, friction: 7 }).start();
    setFabOpen(!fabOpen);
  };

  const closeFab = () => {
    if (fabOpen) {
      Animated.spring(fabAnimation, { toValue: 0, useNativeDriver: true, tension: 60, friction: 7 }).start();
      setFabOpen(false);
    }
  };

  const noteButtonY = fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const checklistButtonY = fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, -150] });
  const subButtonOpacity = fabAnimation.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const overlayOpacity = fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const mainRotate = fabAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (selectedCategory === 'Pinned') {
      filtered = filtered.filter(note => note.pinned === true);
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, selectedCategory, searchQuery]);

  // ✅ Checklist → ChecklistScreen, Note → NoteEditor
  const handleNotePress = (note: Note) => {
    if (note.type === 'checklist') {
      router.push({
        pathname: '/ChecklistScreen',
        params: { noteId: note.id },
      });
    } else {
      router.push({
        pathname: '/NoteEditor',
        params: { noteId: note.id },
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('home.deleteNote'),
      t('home.deleteShort'),
      [
        { text: t('home.cancel'), style: 'cancel' },
        {
          text: t('home.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNote(noteId);
            if (!success) Alert.alert('Error', 'Failed to delete note');
          },
        },
      ]
    );
  };

  const handlePinNote = async (noteId: string) => {
    const success = await togglePin(noteId);
    if (!success) Alert.alert('Error', 'Failed to pin/unpin note');
  };

  const handleCreateNote = () => {
    closeFab();
    router.push('/NoteEditor');
  };

  const handleCreateChecklist = () => {
    closeFab();
    router.push('/ChecklistScreen');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotes();
    setRefreshing(false);
  };

  const toggleLayoutMode = () => {
    setLayoutMode(prev => prev === 'single' ? 'double' : 'single');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={72} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('home.noNote')}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {selectedCategory === 'Pinned'
          ? t('home.noPinNot')
          : searchQuery || selectedCategory !== 'All'
            ? t('home.nonoteMatch')
            : t('home.firstTap')}
      </Text>
    </View>
  );

  const renderNotesGrid = () => {
    if (layoutMode === 'single') {
      return filteredNotes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onPress={handleNotePress}
          onDelete={handleDeleteNote}
          onPin={handlePinNote}
        />
      ));
    } else {
      const leftColumn = filteredNotes.filter((_, i) => i % 2 === 0);
      const rightColumn = filteredNotes.filter((_, i) => i % 2 === 1);
      return (
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {leftColumn.map(note => (
              <NoteCard key={note.id} note={note} onPress={handleNotePress} onDelete={handleDeleteNote} onPin={handlePinNote} />
            ))}
          </View>
          <View style={styles.gridColumn}>
            {rightColumn.map(note => (
              <NoteCard key={note.id} note={note} onPress={handleNotePress} onDelete={handleDeleteNote} onPin={handlePinNote} />
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/PremiumScreen')} style={styles.premiumButton}>
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={24} style={[styles.iconButton, { color: colors.primary }]}/>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLayoutMode} style={styles.layoutButton}>
            <Ionicons
              name={layoutMode === 'single' ? 'grid-outline' : 'list-outline'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push({ pathname: "/SettingsScreen" })}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('home.searchPlaceholder')} />
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <ScrollView
        style={styles.notesList}
        contentContainerStyle={[
          styles.notesListContent,
          filteredNotes.length === 0 && styles.emptyContentContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          renderEmptyState()
        ) : (
          renderNotesGrid()
        )}
      </ScrollView>

      {/* Dark overlay when FAB open */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={closeFab}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: '#000' }]} />
        </TouchableWithoutFeedback>
      )}

      {/* Speed Dial FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">

        {/* Checklist Option */}
        <Animated.View
          style={[styles.fabOptionWrapper, { transform: [{ translateY: checklistButtonY }], opacity: subButtonOpacity }]}
          pointerEvents={fabOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={handleCreateChecklist} activeOpacity={0.8}>
            <View style={[styles.fabPillButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkbox-outline" size={20} color="#fff" />
              <Text style={styles.fabPillText}>{t('home.Checklist')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Note Option */}
        <Animated.View
          style={[styles.fabOptionWrapper, { transform: [{ translateY: noteButtonY }], opacity: subButtonOpacity }]}
          pointerEvents={fabOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={handleCreateNote} activeOpacity={0.8}>
            <View style={[styles.fabPillButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.fabPillText}>{t('home.Note')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Main + / × Button */}
        <TouchableOpacity onPress={toggleFab} style={styles.floatingAddButton} activeOpacity={0.85}>
          <Animated.View
            style={[
              styles.addButtonCircle,
              {
                backgroundColor: fabOpen ? colors.cardBackground : colors.primary,
                borderWidth: fabOpen ? 2 : 0,
                borderColor: colors.primary,
                transform: [{ rotate: mainRotate }],
              },
            ]}
          >
            <Ionicons name="add" size={30} color={fabOpen ? colors.primary : colors.white} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {bannerConfig?.show && (
        <View style={styles.stickyAdContainer}>
          <GAMBannerAd
            unitId={bannerConfig.id}
            sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdLoaded={() => console.log('✅ Banner Ad Loaded')}
            onAdFailedToLoad={(error) => console.log('❌ Banner Ad Failed:', error)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyAdContainer: { width: '100%', alignItems: 'center' },
  gridContainer: { flexDirection: 'row', gap: 10 },
  gridColumn: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 30, paddingBottom: 10,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  premiumButton: { padding: 2 },
  premiumBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layoutButton: { padding: 4 },
  settingsButton: { padding: 4 },
  notesList: { flex: 1 },
  iconButton:{ },
  notesListContent: { padding: 12, paddingBottom: 100 },
  emptyContentContainer: { flexGrow: 1 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { fontSize: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  fabContainer: {
    position: 'absolute', bottom: 120, right: 40,
    zIndex: 999, alignItems: 'flex-end',
  },
  fabOptionWrapper: { position: 'absolute', bottom: 0, right: 0 },
  fabPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,   
    paddingVertical: 12,    
    borderRadius: 30,
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    alignSelf: 'flex-start', 
  },
  fabPillText: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 0 },
  floatingAddButton: {},
  addButtonCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});