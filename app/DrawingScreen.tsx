import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import AdsManager from '@/services/adsManager';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    Canvas,
    Path,
    Skia,
    SkPath,
    useCanvasRef,
} from '@shopify/react-native-skia';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import PurchaseManager from '../services/purchaseManager';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DrawnPath {
    path: SkPath;
    color: string;
    strokeWidth: number;
    opacity: number;
}
interface TextOverlay {
    id: string; text: string;
    x: number; y: number;
    color: string; fontSize: number;
}
interface StickerOverlay {
    id: string; uri: string;
    x: number; y: number; size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type DrawTool = 'pen' | 'finepen' | 'marker' | 'eraser';

// Flat palette — 20 colors like iOS
const PALETTE_COLORS = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF4500', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#9900FF', '#FF00FF', '#FF69B4', '#8B4513', '#006400', '#00008B',
];

const DEFAULT_TOOL_WIDTH: Record<DrawTool, number> = {
    pen: 3, finepen: 1.5, marker: 18, eraser: 24,
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function DrawingScreen() {
    const { colors, isDarkMode } = useTheme();
    const params = useLocalSearchParams();
    const noteId = params.noteId as string | undefined;

    // Canvas ref — needed for snapshot
    const canvasRef = useCanvasRef();

    // Drawing state
    const [paths, setPaths] = useState<DrawnPath[]>([]);
    const [redoStack, setRedoStack] = useState<DrawnPath[]>([]);
    const [livePath, setLivePath] = useState<DrawnPath | null>(null);
    const currentSkPath = useRef<SkPath | null>(null);

    // Tool refs (for gesture closures — avoid stale state)
    const activeToolRef = useRef<DrawTool>('pen');
    const activeColorRef = useRef('#FFD60A');
    const strokeWidthRef = useRef(DEFAULT_TOOL_WIDTH['pen']);
    const opacityRef = useRef(1);
    const { t } = useLanguage();
    const isDarkRef = useRef(isDarkMode);
    isDarkRef.current = isDarkMode;

    // UI state
    const [activeTool, setActiveTool] = useState<DrawTool>('pen');
    const [activeColor, setActiveColor] = useState('#FFD60A');
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_TOOL_WIDTH['pen']);
    const [opacity, setOpacity] = useState(1);

    // Panels
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showStrokePanel, setShowStrokePanel] = useState(false);

    // Modals
    const [showTextInput, setShowTextInput] = useState(false);
    const [pendingText, setPendingText] = useState('');

    // Overlays
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
    const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);

    const [saving, setSaving] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    // Will hold the base64 URI temporarily while user chooses ad/premium
    const pendingUri = useRef<string | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────────
    const syncTool = (t: DrawTool) => {
        setActiveTool(t);
        activeToolRef.current = t;
        const w = DEFAULT_TOOL_WIDTH[t];
        setStrokeWidth(w);
        strokeWidthRef.current = w;
        setOpacity(t === 'marker' ? 0.5 : 1);
        opacityRef.current = t === 'marker' ? 0.5 : 1;
        setShowColorPicker(false);
        setShowAddMenu(false);
        setShowStrokePanel(false);
    };

    const syncColor = (c: string) => {
        setActiveColor(c);
        activeColorRef.current = c;
    };

    const syncStroke = (w: number) => {
        setStrokeWidth(w);
        strokeWidthRef.current = w;
    };

    const syncOpacity = (o: number) => {
        setOpacity(o);
        opacityRef.current = o;
    };

    // ── Pan gesture ───────────────────────────────────────────────────────────────
    const CANVAS_H = SCREEN_H - 200;

    const panGesture = Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
            // Close panels on draw start
            setShowColorPicker(false);
            setShowAddMenu(false);
            setShowStrokePanel(false);

            const p = Skia.Path.Make();
            p.moveTo(e.x, e.y);
            currentSkPath.current = p;
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            setLivePath({
                path: p.copy(), color,
                strokeWidth: strokeWidthRef.current,
                opacity: opacityRef.current,
            });
        })
        .onUpdate((e) => {
            const p = currentSkPath.current;
            if (!p) return;
            p.lineTo(e.x, e.y);
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            try {
                setLivePath({
                    path: p.copy(),
                    color,
                    strokeWidth: strokeWidthRef.current,
                    opacity: opacityRef.current,
                });
            } catch (_) { }
        })
        .onEnd(() => {
            const p = currentSkPath.current;
            // Clear ref FIRST before any async setState
            currentSkPath.current = null;
            setLivePath(null);
            if (!p) return;
            const tool = activeToolRef.current;
            const color = tool === 'eraser'
                ? (isDarkRef.current ? '#000000' : '#FFFFFF')
                : activeColorRef.current;
            try {
                const snapshot = p.copy();
                setPaths(prev => [...prev, {
                    path: snapshot,
                    color,
                    strokeWidth: strokeWidthRef.current,
                    opacity: opacityRef.current,
                }]);
                setRedoStack([]);
            } catch (err) {
                console.warn('DrawingScreen onEnd copy error:', err);
            }
        });

    // ── Undo / Redo ───────────────────────────────────────────────────────────────
    const handleUndo = () => {
        setPaths(prev => {
            if (!prev.length) return prev;
            const copy = [...prev];
            const removed = copy.pop()!;
            setRedoStack(r => [removed, ...r]);
            return copy;
        });
    };

    const handleRedo = () => {
        setRedoStack(prev => {
            if (!prev.length) return prev;
            const [first, ...rest] = prev;
            setPaths(p => [...p, first]);
            return rest;
        });
    };

    // ── Save canvas as image → show popup (ads / premium) ──────────────────────
    const handleDone = async () => {
        if (paths.length === 0 && textOverlays.length === 0 && stickerOverlays.length === 0) {
            router.back();
            return;
        }

        setSaving(true);
        try {
            const image = canvasRef.current?.makeImageSnapshot();
            if (!image) throw new Error('Canvas snapshot failed');

            const base64 = image.encodeToBase64();
            const dataUri = `data:image/png;base64,${base64}`;
            pendingUri.current = dataUri;

            // ✅ Premium user → seedha save, popup nahi
            const isPremium = await PurchaseManager.isPremium();
            if (isPremium) {
                _commitSave();
            } else {
                setShowSavePopup(true);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to save drawing. Please try again.');
            console.error('Drawing save error:', err);
        } finally {
            setSaving(false);
        }
    };


    // ── Called when user picks "Watch Ad" in popup ────────────────────────────
    const handleSaveWithAd = async () => {
        setShowSavePopup(false);
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
            await AdsManager.showReviewAd();
        } catch (e) {
            console.warn('Review ad failed:', e);
        }
        _commitSave();
    };

    // ── Called when user picks "Go Premium" in popup ──────────────────────────
    const handleGoToPremium = () => {
        setShowSavePopup(false);
        router.push('/PremiumScreen');
    };

    // ── Actually commit the drawing to NoteEditor ─────────────────────────────
    const _commitSave = () => {
        if (pendingUri.current) {
            DrawingScreen._lastDrawingUri = pendingUri.current;
            pendingUri.current = null;
        }
        router.back();
    };

    // ── Add menu ──────────────────────────────────────────────────────────────────
    const handleAddSticker = async () => {
        setShowAddMenu(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access to add stickers.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setStickerOverlays(prev => [...prev, {
                id: Date.now().toString(),
                uri: result.assets[0].uri,
                x: SCREEN_W / 2 - 50, y: 200, size: 100,
            }]);
        }
    };

    const handleAddText = () => {
        setShowAddMenu(false);
        setPendingText('');
        setShowTextInput(true);
    };

    const handleConfirmText = () => {
        if (pendingText.trim()) {
            setTextOverlays(prev => [...prev, {
                id: Date.now().toString(),
                text: pendingText,
                x: 40,
                y: 100 + prev.length * 50,
                color: activeColor,
                fontSize: 20,
            }]);
        }
        setShowTextInput(false);
    };

    const handleAddSignature = () => {
        setShowAddMenu(false);
        syncTool('finepen');
        syncColor(isDarkMode ? '#FFFFFF' : '#000000');
        Alert.alert('Signature Mode', 'Draw your signature on the canvas now.');
    };

    const handleAddShape = () => {
        setShowAddMenu(false);
        Alert.alert('Add Shape', 'Shape tool coming soon!');
    };

    const handleAddLoupe = () => {
        setShowAddMenu(false);
        Alert.alert('Loupe', 'Loupe magnifier coming soon!');
    };

    // ── Render ────────────────────────────────────────────────────────────────────
    const bgColor = isDarkMode ? '#000' : '#fff';

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <TouchableOpacity onPress={handleUndo} style={styles.headerIconBtn} disabled={!paths.length}>
                            <Ionicons name="arrow-undo" size={22}
                                color={paths.length ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleRedo} style={styles.headerIconBtn} disabled={!redoStack.length}>
                            <Ionicons name="arrow-redo" size={22}
                                color={redoStack.length ? colors.primary : colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert(t('clearcanvas'), t('clearalldrawing'), [
                                { text: t('Cancel'), style: 'cancel' },
                                { text: t('Clear'), style: 'destructive', onPress: () => { setPaths([]); setRedoStack([]); setTextOverlays([]); setStickerOverlays([]); } },
                            ])}
                            style={styles.headerIconBtn}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleDone}
                        style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                        disabled={saving}
                    >
                        {saving
                            ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>...</Text>
                            : <Ionicons name="checkmark" size={20} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>

                {/* ── Canvas ── */}
                <GestureDetector gesture={panGesture}>
                    <View style={[styles.canvasWrapper, { backgroundColor: bgColor, height: CANVAS_H }]}>
                        <Canvas ref={canvasRef} style={{ width: SCREEN_W, height: CANVAS_H }}>
                            {paths.map((dp, i) => (
                                <Path key={i} path={dp.path} color={dp.color}
                                    style="stroke" strokeWidth={dp.strokeWidth}
                                    strokeCap="round" strokeJoin="round" opacity={dp.opacity} />
                            ))}
                            {livePath && (
                                <Path path={livePath.path} color={livePath.color}
                                    style="stroke" strokeWidth={livePath.strokeWidth}
                                    strokeCap="round" strokeJoin="round" opacity={livePath.opacity} />
                            )}
                        </Canvas>

                        {/* Text overlays */}
                        {textOverlays.map(t => (
                            <View key={t.id} style={[styles.textOverlay, { top: t.y, left: t.x }]}>
                                <Text style={{ color: t.color, fontSize: t.fontSize, fontWeight: '600' }}>
                                    {t.text}
                                </Text>
                            </View>
                        ))}

                        {/* Sticker overlays */}
                        {stickerOverlays.map(s => (
                            <Image key={s.id} source={{ uri: s.uri }}
                                style={[styles.stickerOverlay, { top: s.y, left: s.x, width: s.size, height: s.size }]}
                                resizeMode="contain" />
                        ))}
                    </View>
                </GestureDetector>

                {/* ── Color Picker Panel ── */}
                {showColorPicker && (
                    <View style={[styles.floatingPanel, {
                        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
                        left: 12, right: 12, bottom: 76,
                    }]}>
                        {/* Current color preview + stroke preview */}
                        <View style={styles.colorPreviewRow}>
                            <View style={[styles.colorPreviewSwatch, { backgroundColor: activeColor, opacity }]} />
                            <View style={styles.colorPreviewInfo}>
                                <Text style={[styles.colorPreviewLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                                    {t('home.activecolor')}
                                </Text>
                                <Text style={[styles.colorPreviewSub, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                    {t('home.tapcolorchange')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                                <Ionicons name="close-circle" size={24} color={isDarkMode ? '#636366' : '#C7C7CC'} />
                            </TouchableOpacity>
                        </View>

                        {/* Color grid */}
                        <View style={styles.colorGrid}>
                            {PALETTE_COLORS.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => syncColor(c)}
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: c },
                                        c === activeColor && styles.colorSwatchSelected,
                                        (c === '#FFFFFF') && { borderWidth: 1, borderColor: '#C7C7CC' },
                                    ]}
                                >
                                    {c === activeColor && (
                                        <Ionicons name="checkmark" size={14} color={isLight(c) ? '#000' : '#fff'} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Opacity slider */}
                        <View style={styles.sliderRow}>
                            <Text style={[styles.sliderLabel, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.Opacity')}
                            </Text>
                            <View style={styles.sliderTrack}>
                                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
                                    <TouchableOpacity
                                        key={v}
                                        onPress={() => syncOpacity(v)}
                                        style={[
                                            styles.sliderStep,
                                            { backgroundColor: activeColor, opacity: v },
                                            Math.abs(opacity - v) < 0.05 && styles.sliderStepActive,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.sliderValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {Math.round(opacity * 100)}%
                            </Text>
                        </View>

                        {/* Stroke width slider */}
                        <View style={styles.sliderRow}>
                            <Text style={[styles.sliderLabel, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.Size')}
                            </Text>
                            <View style={styles.sliderTrack}>
                                {[1, 2, 3, 5, 8, 12, 16, 20, 24, 30].map(v => (
                                    <TouchableOpacity
                                        key={v}
                                        onPress={() => syncStroke(v)}
                                        style={[
                                            styles.sliderStep,
                                            { backgroundColor: activeColor },
                                            Math.abs(strokeWidth - v) < 1 && styles.sliderStepActive,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.sliderValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {strokeWidth}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Add Menu ── */}
                {showAddMenu && (
                    <View style={[styles.floatingPanel, {
                        backgroundColor: isDarkMode ? 'rgba(28,28,30,0.97)' : 'rgba(242,242,247,0.97)',
                        right: 12, bottom: 76, width: 230,
                        paddingVertical: 4, paddingHorizontal: 0, marginBottom: 10,
                    }]}>
                        {[
                            { label: t('home.addsticker'), icon: 'leaf-outline', action: handleAddSticker },
                            { label: t('home.addtext'), icon: 'text', action: handleAddText },
                            // { label: 'Add Signature', icon: 'create-outline', action: handleAddSignature },
                            // { label: 'Add Shape', icon: 'shapes-outline', action: handleAddShape },
                            // { label: 'Add Loupe', icon: 'search-circle-outline', action: handleAddLoupe },
                        ].map((item, i, arr) => (
                            <React.Fragment key={item.label}>
                                <TouchableOpacity style={styles.addMenuItem} onPress={item.action} activeOpacity={0.7}>
                                    <View style={[styles.addMenuIconWrap,
                                    { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]}>
                                        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.addMenuLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                                {i < arr.length - 1 && (
                                    <View style={[styles.menuDivider,
                                    { backgroundColor: isDarkMode ? '#3A3A3C' : '#D1D1D6' }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* ── Bottom Toolbar ── */}
                <View style={[styles.toolbar, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>

                    <ToolBtn active={activeTool === 'pen'} onPress={() => syncTool('pen')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="pen" size={activeTool === 'pen' ? 26 : 22}
                            color={activeTool === 'pen' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'finepen'} onPress={() => syncTool('finepen')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="fountain-pen-tip" size={activeTool === 'finepen' ? 26 : 22}
                            color={activeTool === 'finepen' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'marker'} onPress={() => syncTool('marker')} accentColor={activeColor}>
                        <MaterialCommunityIcons name="marker" size={activeTool === 'marker' ? 26 : 22}
                            color={activeTool === 'marker' ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    <ToolBtn active={activeTool === 'eraser'} onPress={() => syncTool('eraser')} accentColor="#FF453A">
                        <MaterialCommunityIcons name="eraser" size={activeTool === 'eraser' ? 26 : 22}
                            color={activeTool === 'eraser' ? '#FF453A' : (isDarkMode ? '#8E8E93' : '#636366')} />
                    </ToolBtn>

                    {/* Color wheel — shows active color */}
                    <ToolBtn
                        active={showColorPicker}
                        onPress={() => { setShowColorPicker(v => !v); setShowAddMenu(false); setShowStrokePanel(false); }}
                        accentColor={activeColor}
                    >
                        <View style={[styles.colorWheelOuter, { borderColor: showColorPicker ? activeColor : (isDarkMode ? '#8E8E93' : '#636366') }]}>
                            <View style={[styles.colorWheelInner, { backgroundColor: activeColor, opacity }]} />
                        </View>
                    </ToolBtn>

                    {/* Plus */}
                    <ToolBtn
                        active={showAddMenu}
                        onPress={() => { setShowAddMenu(v => !v); setShowColorPicker(false); setShowStrokePanel(false); }}
                        accentColor={activeColor}
                    >
                        <View style={[styles.plusCircle,
                        { borderColor: showAddMenu ? activeColor : (isDarkMode ? '#8E8E93' : '#636366') }]}>
                            <Ionicons name={showAddMenu ? 'close' : 'add'} size={18}
                                color={showAddMenu ? activeColor : (isDarkMode ? '#8E8E93' : '#636366')} />
                        </View>
                    </ToolBtn>

                </View>

                {/* ── Save Popup Modal (Ads or Premium) ── */}
                <Modal visible={showSavePopup} transparent animationType="fade">
                    <View style={styles.popupOverlay}>
                        <View style={[styles.popupBox, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                            {/* Crown icon */}
                            <View style={styles.popupIconWrap}>
                                <Ionicons name="diamond" size={32} color="#FF9F0A" />
                            </View>

                            <Text style={[styles.popupTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {t('home.savedrawing')}
                            </Text>
                            <Text style={[styles.popupSub, { color: isDarkMode ? '#8E8E93' : '#636366' }]}>
                                {t('home.gopremiumtosave')}
                            </Text>

                            {/* Watch Ad button */}
                            {/* <TouchableOpacity
                                onPress={handleSaveWithAd}
                                style={[styles.popupBtnAd, { borderColor: colors.primary }]}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
                                <Text style={[styles.popupBtnAdText, { color: colors.primary }]}>
                                    Watch Ad & Save
                                </Text>
                            </TouchableOpacity> */}

                            {/* Premium button */}
                            <TouchableOpacity
                                onPress={handleGoToPremium}
                                style={[styles.popupBtnPremium, { backgroundColor: '#FF9F0A' }]}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="diamond" size={18} color="#fff" />
                                <Text style={styles.popupBtnPremiumText}>{t('home.gopremium')}</Text>
                            </TouchableOpacity>

                            {/* Close / Cancel */}
                            <TouchableOpacity
                                onPress={() => { setShowSavePopup(false); pendingUri.current = null; }}
                                style={styles.popupCancel}
                            >
                                <Text style={{ color: isDarkMode ? '#636366' : '#8E8E93', fontSize: 14 }}>
                                    {t('home.Cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* ── Add Text Modal ──} */}
                <Modal visible={showTextInput} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.textModalOverlay}
                    >
                        <View style={[styles.textModalBox, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff' }]}>
                            <Text style={[styles.textModalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                {t('home.addtext')}
                            </Text>
                            <TextInput
                                style={[styles.textModalInput, {
                                    color: isDarkMode ? '#fff' : '#000',
                                    borderColor: colors.primary,
                                    backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                                }]}
                                placeholder="Type here..."
                                placeholderTextColor={isDarkMode ? '#636366' : '#8E8E93'}
                                value={pendingText}
                                onChangeText={setPendingText}
                                autoFocus
                                multiline
                            />
                            <View style={styles.textModalActions}>
                                <TouchableOpacity onPress={() => setShowTextInput(false)} style={styles.textModalCancel}>
                                    <Text style={{ color: '#8E8E93', fontSize: 16 }}>{t('home.Cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleConfirmText}
                                    style={[styles.textModalConfirm, { backgroundColor: colors.primary }]}>
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('home.add')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

// Static property to pass URI back (simple cross-screen communication)
DrawingScreen._lastDrawingUri = null as string | null;

// ─── Helper ──────────────────────────────────────────────────────────────────────
function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ─── Toolbar button ──────────────────────────────────────────────────────────────
function ToolBtn({ children, active, onPress, accentColor }: {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
    accentColor: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.toolBtn, active && { backgroundColor: accentColor + '22' }]}
            activeOpacity={0.75}
        >
            {children}
        </TouchableOpacity>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4,
    },
    headerBtn: { padding: 8 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    headerIconBtn: { padding: 8 },
    doneBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    canvasWrapper: { overflow: 'hidden' },
    textOverlay: { position: 'absolute', pointerEvents: 'none' },
    stickerOverlay: { position: 'absolute', pointerEvents: 'none' },

    toolbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        paddingVertical: 10, paddingHorizontal: 4,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(120,120,128,0.25)',
    },
    toolBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 10,
    },

    colorWheelOuter: {
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    },
    colorWheelInner: { width: 15, height: 15, borderRadius: 8 },

    plusCircle: {
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },

    // Floating panels
    floatingPanel: {
        position: 'absolute',
        borderRadius: 16, padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2, shadowRadius: 14, elevation: 14,
    },

    // Color picker internals
    colorPreviewRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
    },
    colorPreviewSwatch: {
        width: 44, height: 44, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(120,120,128,0.2)',
    },
    colorPreviewInfo: { flex: 1 },
    colorPreviewLabel: { fontSize: 15, fontWeight: '600' },
    colorPreviewSub: { fontSize: 12, marginTop: 2 },

    colorGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8,
        justifyContent: 'flex-start', marginBottom: 14,
    },
    colorSwatch: {
        width: 34, height: 34, borderRadius: 17,
        alignItems: 'center', justifyContent: 'center',
    },
    colorSwatchSelected: {
        borderWidth: 3, borderColor: '#007AFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    },

    sliderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
    },
    sliderLabel: { fontSize: 12, fontWeight: '500', width: 50 },
    sliderTrack: { flex: 1, flexDirection: 'row', gap: 4 },
    sliderStep: {
        flex: 1, height: 18, borderRadius: 4,
    },
    sliderStepActive: {
        borderWidth: 2, borderColor: '#007AFF',
        transform: [{ scaleY: 1.3 }],
    },
    sliderValue: { fontSize: 12, fontWeight: '600', width: 32, textAlign: 'right' },

    // Add menu
    addMenuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 13, gap: 12, marginBottom: 10,
    },
    addMenuIconWrap: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    addMenuLabel: { fontSize: 16, fontWeight: '500' },
    menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },

    // Text modal
    textModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    textModalBox: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    textModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    textModalInput: {
        borderWidth: 1.5, borderRadius: 12,
        padding: 12, fontSize: 16, minHeight: 80, marginBottom: 16,
    },
    textModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    textModalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
    textModalConfirm: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },

    // Save popup
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    popupBox: {
        width: '100%',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
    },
    popupIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF9F0A22',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    popupSub: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    popupBtnAd: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        marginBottom: 12,
    },
    popupBtnAdText: {
        fontSize: 16,
        fontWeight: '600',
    },
    popupBtnPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        marginBottom: 16,
    },
    popupBtnPremiumText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    popupCancel: {
        paddingVertical: 4,
    },
});