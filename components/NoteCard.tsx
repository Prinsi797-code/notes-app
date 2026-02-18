import { CATEGORY_ICONS } from '@/constants/Categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Note } from '@/types/Note';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onPin: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete, onPin }) => {
  const { colors, isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { t } = useLanguage();

  const textStyle = [
    styles.noteContent,
    note.textStyle?.bold && styles.boldText,
    note.textStyle?.italic && styles.italicText,
    note.textStyle?.underline && styles.underlineText,
  ];

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete(note.id);
  };

  const handlePin = () => {
    setMenuVisible(false);
    onPin(note.id);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      const shareContent = `${note.title}\n\n${note.content}`;
      await Share.share({
        message: shareContent,
        title: note.title,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderContent = () => {
    if (note.textStyle?.list && note.content) {
      return note.content.split('\n').map((line, idx) => (
        <Text key={idx} style={textStyle}>
          • {line}
        </Text>
      ));
    }
    return <Text style={textStyle} numberOfLines={4}>{note.content}</Text>;
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: note.color.color }]}
        onPress={() => onPress(note)}
        activeOpacity={0.7}
      >
        {/* Pin Indicator */}
        {note.pinned && (
          <View style={styles.pinIndicator}>
            <MaterialIcons
                name="push-pin"
                size={16}
                color={colors.primary} 
              />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {note.title}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              const { pageX, pageY } = e.nativeEvent;
              setMenuPosition({ x: pageX, y: pageY });
              setMenuVisible(true);
            }}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>{CATEGORY_ICONS[note.category]}</Text>
          <Text style={styles.categoryText}>{note.category}</Text>
        </View>

        {/* Content */}
        {note.content ? (
          <View style={styles.contentContainer}>
            {renderContent()}
          </View>
        ) : null}

        {/* Images Preview */}
        {note.images && note.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagePreviewContainer}
          >
            {note.images.slice(0, 3).map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.imagePreview} />
            ))}
            {note.images.length > 3 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{note.images.length - 3}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.dateText}>{formatDate(note.updatedAt)}</Text>
          {(note.textStyle.bold || note.textStyle.italic || note.textStyle.underline || note.textStyle.list) && (
            <View style={styles.formattingIndicators}>
              {note.textStyle.bold && <Text style={styles.indicator}>B</Text>}
              {note.textStyle.italic && <Text style={styles.indicator}>I</Text>}
              {note.textStyle.underline && <Text style={styles.indicator}>U</Text>}
              {note.textStyle.list && <Ionicons name="list" size={12} color="#666" />}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                position: 'absolute',
                top: menuPosition.y - 20,
                right: 16,
                backgroundColor: colors.cardBackground,
                borderWidth: isDarkMode ? 1 : 0,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Pin / Unpin */}
            <TouchableOpacity style={styles.menuItem} onPress={handlePin}>
              <MaterialIcons
                name="push-pin"
                size={22}
                color={colors.textPrimary} 
              />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                {note.pinned ? t('home.unpin') : t('home.pin')}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* Share */}
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>{t('home.share')} </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* Delete */}
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#E53935" />
              <Text style={[styles.menuText, styles.deleteText]}>{t('home.delete')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  pinIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    padding: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  contentContainer: {
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
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
  imagePreviewContainer: {
    marginVertical: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImagesOverlay: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  formattingIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    // backgroundColor removed from here — set dynamically via colors.cardBackground
    borderRadius: 12,
    width: 180,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 16,
    // color removed from here — set dynamically via colors.textPrimary
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: '#E53935',
  },
  menuDivider: {
    height: 1,
    // backgroundColor removed from here — set dynamically via colors.border
    marginHorizontal: 16,
  },
});