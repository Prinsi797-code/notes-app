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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const BANNER_HEIGHT = 70;

  const [bannerConfig, setBannerConfig] = useState<{
    show: boolean;
    id: string;
  } | null>(null);

  useEffect(() => {
    const config = AdsManager.getBannerConfig('main');
    console.log('🎯 Banner config:', config);
    if (config) {
      setBannerConfig(config);
    }
  }, []);

  useEffect(() => {
    console.log('📝 Notes list updated:', notes.length, 'notes');
  }, [notes]);

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [])
  );

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by Pinned category
    if (selectedCategory === 'Pinned') {
      filtered = filtered.filter(note => note.pinned === true);
    }
    // Filter by regular category
    else if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort: pinned notes first, then by date
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleNotePress = (note: Note) => {
    console.log('📖 Opening note:', note.id);
    router.push({
      pathname: '/modal',
      params: { noteId: note.id },
    });
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
    if (!success) {
      Alert.alert('Error', 'Failed to pin/unpin note');
    }
  };

  const handleCreateNote = () => {
    router.push('/modal');
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

  const noteCount = filteredNotes.length;
  const totalCount = notes.length;
  const pinnedCount = notes.filter(note => note.pinned).length;

  // Render notes in grid layout
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
      // Double column layout
      const rows = [];
      for (let i = 0; i < filteredNotes.length; i += 2) {
        rows.push(
          <View key={i} style={styles.gridRow}>
            <View style={styles.gridItem}>
              <NoteCard
                note={filteredNotes[i]}
                onPress={handleNotePress}
                onDelete={handleDeleteNote}
                onPin={handlePinNote}
              />
            </View>
            {filteredNotes[i + 1] && (
              <View style={styles.gridItem}>
                <NoteCard
                  note={filteredNotes[i + 1]}
                  onPress={handleNotePress}
                  onDelete={handleDeleteNote}
                  onPin={handlePinNote}
                />
              </View>
            )}
          </View>
        );
      }
      return rows;
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colors.cardBackground }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/PremiumScreen')}
            style={styles.premiumButton}
          >
            <View style={[styles.premiumBadge]}>
              <Ionicons name="diamond" size={24} color="#FF6F00" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLayoutMode} style={styles.layoutButton}>
            <Ionicons
              name={layoutMode === 'single' ? 'grid-outline' : 'list-outline'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() =>
              router.push({
                pathname: "/SettingsScreen"
              })
            }
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('home.searchPlaceholder')}
      />

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ScrollView
        style={styles.notesList}
        contentContainerStyle={[
          styles.notesListContent,
          filteredNotes.length === 0 && styles.emptyContentContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
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

      {/* Floating Add Button - Footer Right */}
      <TouchableOpacity onPress={handleCreateNote} style={styles.floatingAddButton}>
        <View style={[styles.addButtonCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={30} color={colors.white} />
        </View>
      </TouchableOpacity>

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
  container: {
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
    marginTop: 30,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  premiumButton: { padding: 2 },
  premiumBadge: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    // borderWidth: 1, borderColor: '#FFE0B2',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layoutButton: {
    padding: 4,
  },
  settingsButton: {
    padding: 4,
  },
  notesList: {
    flex: 1
  },
  notesListContent: {
    padding: 12,
    paddingBottom: 100,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20
  },
  emptySubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 120,
    right: 30,
    zIndex: 999,
  },
  addButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});