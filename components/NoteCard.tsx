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

  const ts = note.textStyle ?? { bold: false, italic: false, underline: false, list: false };
  const isChecklist = note.type === 'checklist';

  // ✅ Card background:
  // - Both note & checklist use theme background (no user color as bg)
  // - Dark → #1E1E1E, Light → #F5F5F5
  const cardBg = colors.cardBackground;

  // User selected color → only shown as small circle in footer
  const userColor = note.color?.color ?? null;

  const textStyle = [
    styles.noteContent,
    { color: colors.textSecondary },
    ts.bold && styles.boldText,
    ts.italic && styles.italicText,
    ts.underline && styles.underlineText,
  ];

  const handleDelete = () => { setMenuVisible(false); onDelete(note.id); };
  const handlePin = () => { setMenuVisible(false); onPin(note.id); };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({ message: `${note.title}\n\n${note.content}`, title: note.title });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Checklist card preview ─────────────────────────────────────────────────
  const renderChecklistContent = () => {
    if (!note.content) return null;
    const allLines = note.content.split('\n').filter(l => l.trim());
    const preview = allLines.slice(0, 5);
    const remaining = allLines.length - 5;
    return (
      <View style={styles.checklistContainer}>
        {preview.map((line, idx) => {
          const isChecked = line.startsWith('☑');
          const text = line.replace(/^[☐☑]\s*/, '');
          return (
            <View key={idx} style={styles.checklistRow}>
              <View style={[
                styles.checkboxSmall,
                { borderColor: colors.primary },
                isChecked && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}>
                {isChecked && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              <Text
                style={[
                  styles.checklistItemText,
                  { color: colors.textSecondary },
                  isChecked && { textDecorationLine: 'line-through', color: colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {text}
              </Text>
            </View>
          );
        })}
        {remaining > 0 && (
          <Text style={[styles.moreItemsText, { color: colors.textTertiary }]}>
            +{remaining} more items
          </Text>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isChecklist) return renderChecklistContent();
    if (ts.list && note.content) {
      return note.content.split('\n').map((line, idx) => (
        <Text key={idx} style={textStyle}>• {line}</Text>
      ));
    }
    return <Text style={textStyle} numberOfLines={4}>{note.content}</Text>;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: cardBg },
          isDarkMode && { borderWidth: 1, borderColor: colors.border },
        ]}
        onPress={() => onPress(note)}
        activeOpacity={0.7}
      >
        {/* Pin Indicator */}
        {note.pinned && (
          <View style={styles.pinIndicator}>
            <MaterialIcons name="push-pin" size={16} color={colors.primary} />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
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
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Category Badge */}
        <View style={[
          styles.categoryBadge,
          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
        ]}>
          {isChecklist
            ? <Ionicons name="checkbox-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            : <Text style={styles.categoryIcon}>{CATEGORY_ICONS[note.category]}</Text>
          }
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{note.category}</Text>
        </View>

        {/* Content */}
        {note.content ? (
          <View style={styles.contentContainer}>{renderContent()}</View>
        ) : null}

        {/* Images Preview */}
        {!isChecklist && note.images && note.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
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

        {/* ── Footer: date left, color circle right ── */}
        <View style={styles.footer}>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {formatDate(note.updatedAt)}
          </Text>

          {/* ✅ User selected color → small circle, no formatting B/I/U */}
          {/* {userColor && (
            <View style={[styles.colorDot, { backgroundColor: userColor }]} />
          )} */}
          {!isChecklist && userColor && (
            <View style={[styles.colorDot, { backgroundColor: userColor }]} />
          )}
        </View>
      </TouchableOpacity>

      {/* Context Menu Modal */}
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
          <View style={[
            styles.menuContainer,
            {
              position: 'absolute',
              top: menuPosition.y - 20,
              right: 16,
              backgroundColor: colors.cardBackground,
              borderWidth: isDarkMode ? 1 : 0,
              borderColor: colors.border,
            },
          ]}>
            <TouchableOpacity style={styles.menuItem} onPress={handlePin}>
              <MaterialIcons name="push-pin" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                {note.pinned ? t('home.unpin') : t('home.pin')}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>{t('home.share')}</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

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
  pinIndicator: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  menuButton: { padding: 2 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 8,
  },
  categoryIcon: { fontSize: 11, marginRight: 3 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  contentContainer: { marginBottom: 8 },
  noteContent: { fontSize: 13, lineHeight: 18 },
  boldText: { fontWeight: '700' },
  italicText: { fontStyle: 'italic' },
  underlineText: { textDecorationLine: 'underline' },

  // Checklist
  checklistContainer: { gap: 6 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxSmall: {
    width: 16, height: 16, borderRadius: 4,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  checklistItemText: { flex: 1, fontSize: 13 },
  moreItemsText: { fontSize: 11, marginTop: 4 },

  imagePreviewContainer: { marginVertical: 10 },
  imagePreview: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  moreImagesOverlay: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  moreImagesText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  dateText: { fontSize: 12 },

  // ✅ Small color dot in footer
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 7,
    // subtle border so white color is also visible
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: {
    borderRadius: 12, width: 180, paddingVertical: 8,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuText: { fontSize: 16, marginLeft: 12, fontWeight: '500' },
  deleteText: { color: '#E53935' },
  menuDivider: { height: 1, marginHorizontal: 16 },
});