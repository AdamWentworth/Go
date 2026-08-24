import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { CustomTagParent } from '@pokemongonexus/shared-contracts/users';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
import type { NativeTagSummary } from '../features/collection/collectionModel';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../features/collection/NativePokemonHubHeader';

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
  showHeader?: boolean;
};

const toAssetUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const readableTextColor = (color: string): string => {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return '#fff';
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? '#101514' : '#fff';
};

const tagSurface = (tag: NativeTagSummary): string => {
  if (tag.tone === 'favorites') return '#ffe496';
  if (tag.tone === 'trade') return '#67d28d';
  if (tag.tone === 'caught') return '#72aaff';
  if (tag.tone === 'most-wanted') return '#ff8a70';
  if (tag.tone === 'wanted') return '#f17182';
  return tag.color;
};

const NativeTagCard = ({
  assetBaseUrl,
  tag,
  onPress,
}: {
  assetBaseUrl: string;
  tag: NativeTagSummary;
  onPress: () => void;
}) => {
  const surface = tagSurface(tag);
  const previewRows = tag.rows.slice(0, 12);
  return (
    <Pressable
      accessibilityLabel={`Open ${tag.name}, ${tag.rows.length} Pokémon`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tagCard, pressed && styles.pressed]}
    >
      <View style={[styles.preview, { backgroundColor: surface }]}>
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
          </View>
        )) : (
          <View style={styles.emptyPreview}>
            <Text style={[styles.emptyPreviewText, { color: readableTextColor(surface) }]}>No Pokémon yet</Text>
          </View>
        )}
      </View>
      <View style={styles.tagFooter}>
        <View style={styles.tagIdentity}>
          {tag.tone === 'favorites' ? <Text style={styles.favoriteStar}>★</Text> : (
            <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
          )}
          <View style={styles.tagCopy}>
            <Text numberOfLines={1} style={styles.tagName}>{tag.name}</Text>
            <Text style={styles.tagCount}>{tag.rows.length} Pokémon have this tag.</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
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
  showHeader = true,
}: Props) => {
  const light = useColorScheme() === 'light';
  const background = light ? '#f8fff9' : webCssVarTokens.colors.bgApp;
  const text = light ? '#405753' : webCssVarTokens.colors.textPrimary;
  const secondary = light ? '#4b625e' : webCssVarTokens.colors.textSecondary;
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
        contentContainerStyle={styles.list}
        data={tags}
        keyExtractor={(tag) => tag.key}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <View style={styles.headingRow}>
              <View>
                <Text style={[styles.eyebrow, { color: parent === 'caught' ? '#4aa2ff' : '#ef5b72' }]}>
                  {parent === 'caught' ? 'YOUR COLLECTION' : 'YOUR WISHLIST'}
                </Text>
                <Text accessibilityRole="header" style={[styles.title, { color: text }]}>
                  {parent === 'caught' ? 'Inventory tags' : 'Wishlist tags'}
                </Text>
              </View>
              <Text style={[styles.total, { color: secondary }]}>
                {parent === 'caught' ? collectionCount : tags.find((tag) => tag.key === 'system:wanted')?.rows.length ?? 0} Pokémon
              </Text>
            </View>
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
            onPress={() => onSelectTag(item)}
            tag={item}
          />
        )}
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
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/balls/pokeball.png') }}
          style={styles.actionMenuBall}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, gap: 16, padding: 20, paddingBottom: 92 },
  listHeader: { gap: 12 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '900' },
  total: { fontSize: 13, fontWeight: '700', paddingBottom: 3 },
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
    borderWidth: 1,
    borderColor: '#47504f',
    borderRadius: 16,
    backgroundColor: '#232725',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  preview: {
    minHeight: 130,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewCell: { width: '16.666%', height: 55, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 48, height: 48 },
  emptyPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyPreviewText: { fontSize: 14, fontWeight: '800' },
  tagFooter: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagIdentity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center' },
  tagCopy: { minWidth: 0, flex: 1 },
  tagDot: { width: 13, height: 13, marginRight: 6, borderRadius: 7 },
  favoriteStar: { color: '#ffd21c', fontSize: 22, marginRight: 6 },
  tagName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  tagCount: { color: '#bdc5c2', fontSize: 13 },
  chevron: { color: '#d7dfdc', fontSize: 32, lineHeight: 34 },
  emptyState: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  retryButton: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#ef5b72' },
  retryText: { color: '#fff', fontWeight: '900' },
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
