import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  LayoutAnimation,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { memo, useCallback, useMemo, useState } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type {
  CreateCustomTagRequest,
  CustomTagDefinition,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
import type { NativeTagSummary } from '../features/collection/collectionModel';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../features/collection/NativePokemonHubHeader';
import { NativeCustomTagEditorSheet } from '../features/collection/NativeCustomTagEditorSheet';

type Props = {
  activeTagName: string | null;
  assetBaseUrl: string;
  collectionCount: number;
  error: string | null;
  warning?: string | null;
  isLoading: boolean;
  parent: CustomTagParent;
  tags: NativeTagSummary[];
  onActionMenuPress: () => void;
  onRetry: () => void;
  onSelectTag: (tag: NativeTagSummary) => void;
  onViewChange: (view: NativePokemonHubView) => void;
  onCreateTag?: (request: CreateCustomTagRequest) => Promise<unknown>;
  onDeleteTag?: (tagId: string) => Promise<unknown>;
  onSaveOrder?: (parent: CustomTagParent, tagKeys: PokemonTagOrderKey[]) => Promise<unknown>;
  onUpdateTag?: (tagId: string, request: UpdateCustomTagRequest) => Promise<unknown>;
  isEditable?: boolean;
  isSaving?: boolean;
  showHeader?: boolean;
};

const toAssetUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

type TagGradient = readonly [string, string, string];

const SYSTEM_TAG_GRADIENTS: Record<Exclude<NativeTagSummary['tone'], 'custom'>, TagGradient> = {
  favorites: ['#ffd77a', '#fff1aa', '#fff9dc'],
  trade: ['#3aa85f', '#7fdc9e', '#eaf8f1'],
  caught: ['#3f89ff', '#9bc5ff', '#e6f1ff'],
  'most-wanted': ['#ff6f61', '#ff9b89', '#ffe4dc'],
  wanted: ['#dd5260', '#fd9090', '#ffc5cc'],
};

const mixHex = (foreground: string, background: string, foregroundWeight: number): string => {
  const parse = (value: string): [number, number, number] | null => {
    const match = /^#([0-9a-f]{6})$/i.exec(value);
    if (!match) return null;
    const packed = Number.parseInt(match[1], 16);
    return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];
  };
  const front = parse(foreground);
  const back = parse(background);
  if (!front || !back) return background;
  const channel = (index: number) => Math.round(
    front[index] * foregroundWeight + back[index] * (1 - foregroundWeight),
  ).toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

const tagGradient = (tag: NativeTagSummary, cardSurface: string): TagGradient => {
  if (tag.tone !== 'custom') return SYSTEM_TAG_GRADIENTS[tag.tone];
  return [
    mixHex(tag.color, cardSurface, 0.62),
    mixHex(tag.color, cardSurface, 0.24),
    cardSurface,
  ];
};

const NativeTagPreviewBackground = ({ colors }: { colors: TagGradient }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <LinearGradient id="native-tag-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="45%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#native-tag-gradient)" height="100%" width="100%" />
    </Svg>
  </View>
);

const NativeTagCard = memo(function NativeTagCard({
  assetBaseUrl,
  light,
  tag,
  onPressTag,
  onEditTag,
  reorder,
}: {
  assetBaseUrl: string;
  light: boolean;
  tag: NativeTagSummary;
  onPressTag: (tag: NativeTagSummary) => void;
  onEditTag?: (tag: NativeTagSummary) => void;
  reorder?: {
    index: number;
    count: number;
    onMove: (sourceIndex: number, targetIndex: number) => void;
  };
}) {
  const cardSurface = light ? '#f8fff9' : '#222222';
  const titleColor = light ? '#405753' : '#ffffff';
  const subtitleColor = light ? '#405753' : '#dddddd';
  const previewRows = tag.rows.slice(0, 12);
  const [cardDragY] = useState(() => new Animated.Value(0));
  const [dragging, setDragging] = useState(false);
  return (
    <Animated.View
      style={[
        styles.tagCard,
        { backgroundColor: cardSurface },
        tag.tone === 'custom' ? { borderColor: `${tag.color}7a`, borderWidth: 1 } : null,
        reorder ? { transform: [{ translateY: cardDragY }] } : null,
        dragging && styles.draggingCard,
      ]}
    >
      <Pressable
        accessibilityLabel={`Open ${tag.name}, ${tag.rows.length} Pokémon`}
        accessibilityRole="button"
        disabled={Boolean(reorder)}
        onPress={() => onPressTag(tag)}
        style={({ pressed }) => pressed && !reorder ? styles.pressed : null}
      >
      <View style={styles.preview} pointerEvents="none">
        <NativeTagPreviewBackground colors={tagGradient(tag, cardSurface)} />
        {previewRows.length ? previewRows.map((row) => (
          <View key={row.id} style={styles.previewCell}>
            {row.imageUri ? (
              <Image
                accessibilityElementsHidden
                resizeMode="contain"
                source={{ uri: row.imageUri }}
                style={styles.previewImage}
              />
            ) : null}
            {row.maxKind ? (
              <Image
                accessibilityElementsHidden
                resizeMode="contain"
                source={{
                  uri: toAssetUrl(
                    assetBaseUrl,
                    row.maxKind === 'gigantamax'
                      ? '/images/gigantamax.png'
                      : '/images/dynamax.png',
                  ),
                }}
                style={styles.previewMaxBadge}
                testID={`native-tag-preview-${row.maxKind}`}
              />
            ) : null}
          </View>
        )) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>No Pokémon in this tag.</Text>
          </View>
        )}
      </View>
      <View style={styles.tagFooter}>
        <View style={styles.tagIdentity}>
          {tag.tone === 'custom' ? (
            <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
          ) : null}
          <View style={styles.tagCopy}>
            <Text numberOfLines={1} style={[styles.tagName, { color: titleColor }]}>{tag.name}</Text>
            <Text style={[styles.tagCount, { color: subtitleColor }]}>
              {tag.rows.length} Pokémon have this tag.
            </Text>
          </View>
        </View>
        {reorder ? (
          <NativeTagDragGrip
            count={reorder.count}
            dragY={cardDragY}
            index={reorder.index}
            onDragEnd={() => setDragging(false)}
            onDragStart={() => setDragging(true)}
            onMove={reorder.onMove}
          />
        ) : tag.tone === 'custom' && onEditTag ? (
          <Pressable
            accessibilityLabel={`Edit ${tag.name}`}
            accessibilityRole="button"
            onPress={(event) => {
              event?.stopPropagation?.();
              onEditTag(tag);
            }}
            style={[styles.editButton, { borderColor: `${tag.color}8f`, backgroundColor: `${tag.color}24` }]}
          >
            <Text style={[styles.editText, { color: titleColor }]}>Edit</Text>
          </Pressable>
        ) : tag.tone === 'favorites' ? <Text style={styles.favoriteStar}>★</Text> : null}
      </View>
      </Pressable>
    </Animated.View>
  );
});

const NativeTagDragGrip = ({
  count,
  dragY,
  index,
  onDragEnd,
  onDragStart,
  onMove,
}: {
  count: number;
  dragY: Animated.Value;
  index: number;
  onDragEnd: () => void;
  onDragStart: () => void;
  onMove: (sourceIndex: number, targetIndex: number) => void;
}) => {
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragY.setValue(0);
      onDragStart();
    },
    onPanResponderMove: Animated.event([null, { dy: dragY }], { useNativeDriver: false }),
    onPanResponderRelease: (_event, gesture) => {
      const targetIndex = Math.max(0, Math.min(count - 1, index + Math.round(gesture.dy / TAG_CARD_STRIDE)));
      if (targetIndex !== index) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onMove(index, targetIndex);
      }
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(onDragEnd);
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(onDragEnd);
    },
  }), [count, dragY, index, onDragEnd, onDragStart, onMove]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityHint="Press and drag to move this tag"
      accessibilityLabel="Reorder tag"
      accessibilityRole="adjustable"
      style={styles.dragGrip}
    >
      <Text style={styles.dragGripText}>⠿</Text>
    </Animated.View>
  );
};

const TAG_CARD_STRIDE = 208;

const definitionFromSummary = (tag: NativeTagSummary): CustomTagDefinition | null => {
  if (tag.tone !== 'custom' || !tag.key.startsWith('custom:')) return null;
  return {
    tag_id: tag.key.slice('custom:'.length),
    parent: tag.parent,
    name: tag.name,
    color: tag.color,
    sort: 0,
    created_at: '',
  };
};

export const NativeTagsPanelScreen = ({
  activeTagName,
  assetBaseUrl,
  collectionCount,
  error,
  warning = null,
  isLoading,
  parent,
  tags,
  onActionMenuPress,
  onRetry,
  onSelectTag,
  onViewChange,
  onCreateTag,
  onDeleteTag,
  onSaveOrder,
  onUpdateTag,
  isEditable = false,
  isSaving = false,
  showHeader = true,
}: Props) => {
  const light = useColorScheme() === 'light';
  const background = light ? '#f8fff9' : webCssVarTokens.colors.bgApp;
  const text = light ? '#405753' : webCssVarTokens.colors.textPrimary;
  const secondary = light ? '#4b625e' : webCssVarTokens.colors.textSecondary;
  const [reordering, setReordering] = useState(false);
  const [draftKeys, setDraftKeys] = useState<PokemonTagOrderKey[]>([]);
  const [editingTag, setEditingTag] = useState<CustomTagDefinition | null>(null);
  const [creating, setCreating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const orderedTags = useMemo(() => {
    if (!reordering) return tags;
    const byKey = new Map(tags.map((tag) => [tag.key, tag]));
    return draftKeys.flatMap((key) => {
      const tag = byKey.get(key);
      return tag ? [tag] : [];
    });
  }, [draftKeys, reordering, tags]);
  const openTagEditor = useCallback((tag: NativeTagSummary) => {
    setEditingTag(definitionFromSummary(tag));
  }, []);

  const startReordering = () => {
    setOperationError(null);
    setDraftKeys(tags.map((tag) => tag.key));
    setReordering(true);
  };
  const moveTag = (sourceIndex: number, targetIndex: number) => {
    setDraftKeys((current) => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      if (!moved) return current;
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };
  const saveOrder = async () => {
    if (!onSaveOrder) return;
    setOperationError(null);
    try {
      await onSaveOrder(parent, draftKeys);
      setReordering(false);
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Could not save your tag order.');
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: background }]} testID={`native-${parent}-tags-screen`}>
      {showHeader ? (
        <NativePokemonHubHeader
          activeTag={activeTagName}
          activeTagParent={parent}
          activeView={parent === 'caught' ? 'inventory' : 'wishlist'}
          backgroundColor={background}
          collectionCount={collectionCount}
          onViewChange={onViewChange}
          secondaryTextColor={secondary}
          textColor={text}
        />
      ) : null}
      <FlatList
        accessibilityLabel={parent === 'caught' ? 'Inventory tags' : 'Wanted tags'}
        contentContainerStyle={styles.list}
        data={orderedTags}
        initialNumToRender={3}
        keyExtractor={(tag) => tag.key}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        updateCellsBatchingPeriod={48}
        windowSize={3}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <View style={styles.toolbar}>
              <Text style={[styles.total, { color: secondary }]}>
                {parent === 'caught'
                  ? collectionCount
                  : tags.find((tag) => tag.key === 'system:wanted')?.rows.length ?? 0} Pokémon
              </Text>
              {isEditable ? reordering ? (
                <View style={styles.orderActions}>
                  <Pressable accessibilityRole="button" onPress={() => setReordering(false)} style={[styles.toolbarButton, { borderColor: secondary }]}>
                    <Text style={[styles.toolbarButtonText, { color: text }]}>× Cancel</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void saveOrder()} style={[styles.toolbarButton, styles.saveOrderButton]}>
                    <Text style={styles.saveOrderText}>{isSaving ? 'Saving…' : '✓ Save order'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable accessibilityRole="button" onPress={startReordering} style={[styles.toolbarButton, { borderColor: secondary }]}>
                  <Text style={[styles.toolbarButtonText, { color: text }]}>↕ Arrange</Text>
                </Pressable>
              ) : null}
            </View>
            {reordering ? <Text style={[styles.orderHelp, { color: secondary }]}>Press and drag a grip to move its tag.</Text> : null}
            {operationError ? <Text accessibilityRole="alert" style={styles.operationError}>{operationError}</Text> : null}
            {warning ? (
              <View accessibilityRole="alert" style={styles.warningCard}>
                <Text style={styles.warningTitle}>Custom tags are temporarily unavailable</Text>
                <Text style={styles.warningBody}>Your collection and system tags are still ready to use.</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {isLoading ? <ActivityIndicator color="#42d4c4" size="large" /> : null}
            <Text style={[styles.emptyTitle, { color: text }]}>
              {error ? 'Tags unavailable' : isLoading ? 'Loading your tags…' : 'No tags found'}
            </Text>
            {error ? <Text style={[styles.emptyBody, { color: secondary }]}>{error}</Text> : null}
            {error ? (
              <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <NativeTagCard
            assetBaseUrl={assetBaseUrl}
            light={light}
            onPressTag={onSelectTag}
            onEditTag={item.tone === 'custom' ? openTagEditor : undefined}
            reorder={reordering ? {
              index: orderedTags.findIndex((tag) => tag.key === item.key),
              count: orderedTags.length,
              onMove: moveTag,
            } : undefined}
            tag={item}
          />
        )}
        ListFooterComponent={isEditable && !reordering ? (
          <Pressable
            accessibilityLabel={`New ${parent === 'wanted' ? 'wanted' : 'inventory'} tag`}
            accessibilityRole="button"
            onPress={() => setCreating(true)}
            style={[styles.createButton, parent === 'wanted' && styles.createButtonWanted]}
          >
            <Text style={[styles.createButtonText, { color: text }]}>+ New {parent === 'wanted' ? 'wanted' : 'inventory'} tag</Text>
          </Pressable>
        ) : null}
      />
      <Pressable
        accessibilityLabel="Open action menu"
        accessibilityRole="button"
        onPress={onActionMenuPress}
        style={styles.actionMenuAnchor}
      >
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_action_menu.png') }}
          style={styles.actionMenuBall}
        />
      </Pressable>
      {onCreateTag && onDeleteTag && onUpdateTag && (creating || editingTag) ? (
        <NativeCustomTagEditorSheet
          isSaving={isSaving}
          onClose={() => {
            setCreating(false);
            setEditingTag(null);
          }}
          onCreate={onCreateTag}
          onDelete={onDeleteTag}
          onUpdate={onUpdateTag}
          parent={editingTag?.parent ?? parent}
          tag={editingTag}
          key={editingTag?.tag_id ?? `new:${parent}`}
          visible
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, padding: 20, paddingBottom: 92 },
  listHeader: { gap: 12 },
  toolbar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  total: { flex: 1, paddingHorizontal: 2, textAlignVertical: 'center', fontSize: 13, fontWeight: '400' },
  orderActions: { flexDirection: 'row', gap: 6 },
  toolbarButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  toolbarButtonText: { fontSize: 12, fontWeight: '900' },
  saveOrderButton: { borderColor: '#2fc17d', backgroundColor: '#2fc17d2e' },
  saveOrderText: { color: '#70e6aa', fontSize: 12, fontWeight: '900' },
  orderHelp: { marginHorizontal: 2, fontSize: 12, lineHeight: 16 },
  operationError: { padding: 10, borderWidth: 1, borderColor: '#ef5b72', borderRadius: 10, color: '#ef5b72', fontSize: 12, fontWeight: '800' },
  warningCard: {
    gap: 2,
    borderWidth: 1,
    borderColor: '#a1772c',
    borderRadius: 12,
    backgroundColor: '#332a18',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningTitle: { color: '#ffe0a0', fontSize: 13, fontWeight: '900' },
  warningBody: { color: '#d9c79f', fontSize: 12, lineHeight: 17 },
  tagCard: {
    overflow: 'hidden',
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  draggingCard: {
    zIndex: 50,
    elevation: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  preview: {
    minHeight: 124,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewCell: {
    position: 'relative',
    width: '16.666%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  previewImage: { width: '100%', height: '100%' },
  previewMaxBadge: { position: 'absolute', top: 2, right: 2, width: 13, height: 13 },
  emptyPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyPreviewText: { color: '#525252', fontSize: 15, fontWeight: '500', opacity: 0.9 },
  tagFooter: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagIdentity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center' },
  tagCopy: { minWidth: 0, flex: 1 },
  tagDot: { width: 12, height: 12, marginRight: 7, borderWidth: 1, borderColor: '#ffffff99', borderRadius: 6 },
  favoriteStar: { color: '#ffd21c', fontSize: 22 },
  editButton: { minWidth: 54, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 19 },
  editText: { fontSize: 12, fontWeight: '900' },
  dragGrip: { width: 52, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff47', borderRadius: 12, backgroundColor: '#ffffff12', zIndex: 10, elevation: 8 },
  dragGripText: { color: '#f5fffc', fontSize: 25, fontWeight: '900' },
  tagName: { fontSize: 18, fontWeight: '700' },
  tagCount: { fontSize: 14, lineHeight: 16 },
  emptyState: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  retryButton: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#ef5b72' },
  retryText: { color: '#fff', fontWeight: '900' },
  createButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#2196f3', borderRadius: 10, backgroundColor: '#2196f31a' },
  createButtonWanted: { borderColor: '#f44336', backgroundColor: '#f443361a' },
  createButtonText: { fontWeight: '900' },
  actionMenuAnchor: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    zIndex: 21,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -27,
    borderWidth: 3,
    borderColor: '#d9ffff',
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  actionMenuBall: { width: 48, height: 48 },
});
