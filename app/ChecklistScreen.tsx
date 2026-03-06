import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { useNotes } from '@/hooks/useNotes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const itemsToContent = (items: ChecklistItem[]) =>
  items
    .filter(i => i.text.trim())
    .map(i => `${i.checked ? '☑' : '☐'} ${i.text.trim()}`)
    .join('\n');

// Parse saved content back into ChecklistItems
const contentToItems = (content: string): ChecklistItem[] => {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [{ id: generateId(), text: '', checked: false }];
  return lines.map(line => ({
    id: generateId(),
    text: line.replace(/^[☐☑]\s*/, ''),
    checked: line.startsWith('☑'),
  }));
};

export default function ChecklistScreen() {
  const { colors } = useTheme();
  const { addNote, updateNote, notes } = useNotes();
  const { t } = useLanguage();
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();

  const [title, setTitle] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: generateId(), text: '', checked: false },
  ]);
  const [saving, setSaving] = useState(false);
  const isEditing = !!noteId;

  const inputRefs = useRef<Record<string, TextInput | null>>({});

  // ── Load existing checklist if editing ───────────────────────────────────
  useEffect(() => {
    if (noteId && notes) {
      const existing = notes.find(n => n.id === noteId);
      if (existing) {
        setTitle(existing.title);
        setItems(contentToItems(existing.content));
      }
    }
  }, [noteId, notes]);

  // ── Item Actions ─────────────────────────────────────────────────────────
  const addItem = (afterId?: string) => {
    const newItem: ChecklistItem = { id: generateId(), text: '', checked: false };
    setItems(prev => {
      if (!afterId) return [...prev, newItem];
      const idx = prev.findIndex(i => i.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      return next;
    });
    setTimeout(() => inputRefs.current[newItem.id]?.focus(), 80);
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      if (prev.length === 1) return [{ id: generateId(), text: '', checked: false }];
      return prev.filter(i => i.id !== id);
    });
  };

  const updateItemText = (id: string, text: string) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, text } : i)));
  };

  const toggleItemCheck = (id: string) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setItems(prev => {
      const unchecked = prev.filter(i => !i.checked);
      const checked = prev.filter(i => i.checked);
      const idx = unchecked.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === unchecked.length - 1) return prev;
      const reordered = [...unchecked];
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
      return [...reordered, ...checked];
    });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your checklist.');
      return;
    }
    const validItems = items.filter(i => i.text.trim());
    if (validItems.length === 0) {
      Alert.alert('Empty Checklist', 'Please add at least one item.');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: title.trim(),
        content: itemsToContent(validItems),
        category: 'Checklist',
        type: 'checklist',
        checklistItems: validItems,
        textStyle: { bold: false, italic: false, underline: false, list: false },
        color: { color: '#ffffff' },
        pinned: false,
        images: [],
      };

      if (isEditing) {
        // Update existing checklist
        await updateNote(noteId!, noteData);
      } else {
        // Create new checklist
        await addNote(noteData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save checklist. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleCancel = () => {
    const hasData = title.trim() || items.some(i => i.text.trim());
    if (hasData) {
      Alert.alert(t('home.Discardchanges'), t('home.unsavedchanges'), [
        { text: t('home.keepEditing'), style: 'cancel' },
        {
          text: t('home.discard'),
          style: 'destructive',
          onPress: () =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)'),
        },
      ]);
    } else {
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEditing ? t('home.Checklist') : t('home.Checklist')}
          </Text>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            {saving
              ? <Text style={styles.saveBtnText}>...</Text>
              : <Ionicons name="checkmark" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
            placeholder= {t('home.checklisttitle')}
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditing}
            returnKeyType="next"
          />

          {/* Unchecked Items */}
          {uncheckedItems.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => toggleItemCheck(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <View style={[styles.checkbox, { borderColor: colors.primary }]} />
              </TouchableOpacity>

              <TextInput
                ref={ref => { inputRefs.current[item.id] = ref; }}
                style={[styles.itemInput, { color: colors.textPrimary }]}
                value={item.text}
                onChangeText={text => updateItemText(item.id, text)}
                placeholder={t('home.listitem')}
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={() => addItem(item.id)}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TouchableOpacity onPress={() => moveItem(item.id, 'up')} disabled={index === 0} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.border : colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => moveItem(item.id, 'down')} disabled={index === uncheckedItems.length - 1} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons
                  name="chevron-down" size={18}
                  color={index === uncheckedItems.length - 1 ? colors.border : colors.textTertiary}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Item */}
          <TouchableOpacity onPress={() => addItem()} style={styles.addItemBtn} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.addItemText, { color: colors.primary }]}>{t('home.additem')}</Text>
          </TouchableOpacity>

          {/* Completed Section */}
          {checkedItems.length > 0 && (
            <View style={styles.completedSection}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.completedLabel, { color: colors.textTertiary }]}>
                Completed ({checkedItems.length})
              </Text>
              {checkedItems.map(item => (
                <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={() => toggleItemCheck(item.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <View style={[styles.checkboxFilled, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.checkedText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {item.text}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 20, borderBottomWidth: 1,
  },
  headerButton: { padding: 4, minWidth: 50 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  saveBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  titleInput: { fontSize: 26, fontWeight: '700', marginBottom: 24, paddingVertical: 6, borderBottomWidth: 2 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2 },
  checkboxFilled: { width: 22, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  itemInput: { flex: 1, fontSize: 16, paddingVertical: 2 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 8 },
  addItemText: { fontSize: 16, fontWeight: '500' },
  completedSection: { marginTop: 16 },
  divider: { height: 1, marginBottom: 14 },
  completedLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  checkedText: { flex: 1, fontSize: 16, textDecorationLine: 'line-through' },
});