import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { memo, useState } from 'react';
import {
  collectionParityTokens,
  webCssVarTokens,
} from '@pokemongonexus/shared-ui-tokens';
import type {
  CollectionParityCardFixture,
  CollectionParityTheme,
} from './collectionParityFixtures';
import { COLLECTION_PARITY_FIXTURES } from './collectionParityFixtures';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../NativePokemonHubHeader';
import { NativePokemonStatusGlow } from './NativePokemonStatusGlow';
import { NativePokemonLocationBackdrop } from './NativePokemonLocationBackdrop';
import {
  NativeCollectionSearchControls,
  NativeCollectionSearchMenu,
} from './NativeCollectionSearchControls';
import { NativeCollectionPriorityStar } from './NativeCollectionPriorityStar';

type NativeCollectionParityFixtureProps = {
  assetBaseUrl?: string;
  activeTag?: string | null;
  cards?: CollectionParityCardFixture[];
  collectionCount?: number;
  customTagColor?: string;
  error?: string | null;
  isLoading?: boolean;
  onActionMenuPress?: () => void;
  onCardPress?: (card: CollectionParityCardFixture) => void;
  onCardLongPress?: (card: CollectionParityCardFixture) => void;
  onClearTag?: () => void;
  onQueryChange?: (query: string) => void;
  onToggleEvolutionaryLine?: () => void;
  onPokemonPress?: () => void;
  onRetry?: () => void;
  onSortPress?: () => void;
  onTagsPress?: () => void;
  onWishlistPress?: () => void;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onSelectionActionPress?: () => void;
  activeView?: NativePokemonHubView;
  query?: string;
  sortDirection?: 'ascending' | 'descending';
  sortIconPath?: string;
  sortLabel?: string;
  showEvolutionaryLine?: boolean;
  tagCanClear?: boolean;
  tagTone?: 'caught' | 'trade' | 'favorites' | 'wanted' | 'most-wanted' | 'custom';
  theme?: CollectionParityTheme;
  showHeader?: boolean;
  selectedIds?: ReadonlySet<string>;
  selectionAction?: 'add' | 'organize';
};

const LIGHT = {
  background: collectionParityTokens.colors.light.page,
  text: collectionParityTokens.colors.light.textPrimary,
  secondaryText: collectionParityTokens.colors.light.textSecondary,
  headerInactive: collectionParityTokens.colors.light.headerInactive,
  search: collectionParityTokens.colors.light.searchSurface,
  searchText: collectionParityTokens.colors.light.searchText,
  tagText: collectionParityTokens.colors.light.tagTitle,
};

const DARK = {
  background: webCssVarTokens.colors.bgApp,
  text: webCssVarTokens.colors.textPrimary,
  secondaryText: collectionParityTokens.colors.dark.textSecondary,
  headerInactive: collectionParityTokens.colors.dark.headerInactive,
  search: '#fff',
  searchText: '#111',
  tagText: '#fff',
};

const GRID_GAP = collectionParityTokens.grid.gap;
const GRID_HORIZONTAL_PADDING = collectionParityTokens.grid.horizontalPadding;

const TAG_TONES = {
  caught: {
    accent: '#3f89ff',
    contrast: '#ffffff',
    surface: 'rgba(63, 137, 255, 0.18)',
  },
  trade: {
    accent: '#3aa85f',
    contrast: '#ffffff',
    surface: 'rgba(58, 168, 95, 0.18)',
  },
  favorites: {
    accent: '#ffd45a',
    contrast: '#171106',
    surface: 'rgba(255, 212, 90, 0.18)',
  },
  wanted: {
    accent: '#dd5260',
    contrast: '#ffffff',
    surface: 'rgba(221, 82, 96, 0.18)',
  },
  'most-wanted': {
    accent: '#ff6f61',
    contrast: '#ffffff',
    surface: 'rgba(255, 111, 97, 0.18)',
  },
  custom: {
    accent: '#1db5d1',
    contrast: '#071014',
    surface: 'rgba(29, 181, 209, 0.18)',
  },
} as const;

const customTagSurface = (color: string): string =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}2e` : TAG_TONES.custom.surface;

const toAssetUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const CollectionParityCard = memo(function CollectionParityCard({
  assetBaseUrl,
  card,
  cardWidth,
  onPressCard,
  onLongPressCard,
  selected,
  theme,
}: {
  assetBaseUrl: string;
  card: CollectionParityCardFixture;
  cardWidth: number;
  onPressCard?: (card: CollectionParityCardFixture) => void;
  onLongPressCard?: (card: CollectionParityCardFixture) => void;
  selected: boolean;
  theme: CollectionParityTheme;
}) {
  const palette = theme === 'light' ? LIGHT : DARK;
  return (
    <Pressable
      accessibilityLabel={`${card.interaction === 'select' ? 'Select' : 'View'} ${card.name}`}
      accessibilityRole="button"
      delayLongPress={450}
      onLongPress={onLongPressCard ? () => onLongPressCard(card) : undefined}
      onPress={onPressCard ? () => onPressCard(card) : undefined}
      style={[styles.card, selected && styles.selectedCard, { width: cardWidth }]}
      testID={`parity-card-${card.id}`}
    >
      <NativePokemonStatusGlow ownership={card.ownership} />
      <View style={styles.cardTopLine}>
        <View
          accessibilityLabel={card.cp == null ? undefined : `CP ${card.cp}`}
          style={[styles.cpDisplay, card.cp == null ? styles.hidden : null]}
        >
          <Text style={[styles.cpLabel, { color: palette.text }]}>CP</Text>
          <Text style={[styles.cpValue, { color: palette.text }]}>
            {card.cp ?? '000'}
          </Text>
        </View>
        {card.favorite || card.mostWanted ? (
          <NativeCollectionPriorityStar
            label={card.favorite ? 'Favorite' : 'Most Wanted'}
            size={18}
            style={[
              styles.priorityStar,
            ]}
            tone={card.favorite ? 'favorite' : 'most-wanted'}
          />
        ) : null}
      </View>
      <View style={styles.imageStage}>
        {card.locationBackgroundPath ? (
          <NativePokemonLocationBackdrop
            uri={toAssetUrl(assetBaseUrl, card.locationBackgroundPath)}
          />
        ) : null}
        {card.lucky ? (
          <Image
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
            style={styles.luckyBackground}
          />
        ) : null}
        <Image
          accessibilityLabel={card.name}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, card.imagePath) }}
          style={styles.pokemonImage}
        />
        {card.maxKind ? (
          <Image
            accessibilityLabel={card.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
            resizeMode="contain"
            source={{
              uri: toAssetUrl(
                assetBaseUrl,
                card.maxKind === 'gigantamax'
                  ? '/images/gigantamax.png'
                  : '/images/dynamax.png',
              ),
            }}
            style={styles.maxBadge}
          />
        ) : null}
        {card.purified ? (
          <Image
            accessibilityLabel="Purified"
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/purified.png') }}
            style={styles.purifiedBadge}
          />
        ) : null}
      </View>
      <Text style={[styles.dexNumber, { color: palette.secondaryText }]}>
        #{card.dexNumber}
      </Text>
      <View style={styles.typeIcons}>
        {card.typeIconPaths.map((path) => (
          <Image
            accessibilityElementsHidden
            key={path}
            source={{ uri: toAssetUrl(assetBaseUrl, path) }}
            style={styles.typeIcon}
          />
        ))}
      </View>
      <Text numberOfLines={2} style={[styles.name, { color: palette.text }]}>
        {card.name}
      </Text>
    </Pressable>
  );
});

export const NativeCollectionParityFixture = ({
  assetBaseUrl = 'https://pokegonexus.com',
  activeTag = 'Favorites',
  cards = COLLECTION_PARITY_FIXTURES,
  collectionCount = 168,
  customTagColor = TAG_TONES.custom.accent,
  error = null,
  isLoading = false,
  onActionMenuPress,
  onCardPress,
  onCardLongPress,
  onClearTag,
  onQueryChange,
  onToggleEvolutionaryLine,
  onPokemonPress,
  onRetry,
  onSortPress,
  onTagsPress,
  onWishlistPress,
  onClearSelection,
  onSelectAll,
  onSelectionActionPress,
  activeView = 'pokemon',
  query = '',
  sortDirection = 'ascending',
  sortIconPath = '/images/sorting/number.png',
  sortLabel = 'Sort by Pokédex number ascending',
  showEvolutionaryLine = false,
  tagCanClear = true,
  tagTone = 'favorites',
  theme = 'dark',
  showHeader = true,
  selectedIds = new Set<string>(),
  selectionAction = 'organize',
}: NativeCollectionParityFixtureProps) => {
  const { width } = useWindowDimensions();
  const [searchMenuVisible, setSearchMenuVisible] = useState(false);
  const palette = theme === 'light' ? LIGHT : DARK;
  const columns = width < 481 ? 3 : width < 1024 ? 6 : 9;
  const cardWidth = Math.floor(
    (width - (GRID_HORIZONTAL_PADDING * 2) - (GRID_GAP * (columns - 1))) / columns,
  );
  const baseTagColors = TAG_TONES[tagTone];
  const tagColors = tagTone === 'custom'
    ? {
        ...baseTagColors,
        accent: customTagColor,
        surface: customTagSurface(customTagColor),
      }
    : baseTagColors;
  const appendFilter = (filter: string) => {
    const nextQuery = query.trim() ? `${query}&${filter}` : filter;
    onQueryChange?.(nextQuery);
    setSearchMenuVisible(false);
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: palette.background }]}
      testID="native-collection-parity-fixture"
    >
      {showHeader ? (
        <NativePokemonHubHeader
          activeTag={activeTag}
          activeTagParent={tagTone === 'wanted' || tagTone === 'most-wanted' ? 'wanted' : 'caught'}
          activeView={activeView}
          backgroundColor={palette.background}
          collectionCount={collectionCount}
          inactiveTextColor={palette.headerInactive}
          onViewChange={(view) => {
            if (view === 'inventory') onTagsPress?.();
            else if (view === 'wishlist') onWishlistPress?.();
            else onPokemonPress?.();
          }}
          secondaryTextColor={palette.secondaryText}
          selectionBackgroundColor={theme === 'light' ? '#e3f7dc' : '#34807d'}
          selectionCount={selectedIds.size}
          onClearSelection={onClearSelection}
          onSelectAll={onSelectAll}
          textColor={palette.text}
        />
      ) : null}

      <FlatList
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        data={searchMenuVisible ? [] : cards}
        initialNumToRender={18}
        key={columns}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={18}
        numColumns={columns}
        removeClippedSubviews
        updateCellsBatchingPeriod={32}
        windowSize={5}
        ListHeaderComponent={(
          <View style={styles.collectionControls}>
            <NativeCollectionSearchControls
              assetBaseUrl={assetBaseUrl}
              inputBackground={palette.search}
              inputTextColor={palette.searchText}
              menuVisible={searchMenuVisible}
              onMenuVisibleChange={setSearchMenuVisible}
              onQueryChange={(value) => onQueryChange?.(value)}
              onToggleEvolutionaryLine={() => onToggleEvolutionaryLine?.()}
              query={query}
              showEvolutionaryLine={showEvolutionaryLine}
              textColor={palette.text}
            />
            {activeTag ? (
              <View
                style={[
                  styles.activeTagChip,
                  {
                    backgroundColor: tagColors.surface,
                    borderColor: tagColors.accent,
                    paddingRight: tagCanClear ? 5 : 9,
                  },
                ]}
              >
                {tagTone === 'favorites' ? (
                  <NativeCollectionPriorityStar
                    label="Favorites tag"
                    size={16}
                    style={styles.tagStar}
                    tone="favorite"
                  />
                ) : (
                  <View
                    accessibilityElementsHidden
                    style={[styles.tagDot, { backgroundColor: tagColors.accent }]}
                  />
                )}
                <Text style={[styles.activeTagText, { color: palette.tagText }]}>
                  {activeTag}
                </Text>
                {tagCanClear ? (
                  <Pressable
                    accessibilityLabel={`Clear ${activeTag} tag filter`}
                    accessibilityRole="button"
                    onPress={onClearTag}
                    style={[styles.clearTag, { backgroundColor: tagColors.accent }]}
                  >
                    <Text style={[styles.clearTagText, { color: tagColors.contrast }]}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {error ? (
              <View accessibilityRole="alert" style={styles.errorCard}>
                <Text style={[styles.errorTitle, { color: palette.text }]}>Collection unavailable</Text>
                <Text style={[styles.errorBody, { color: palette.secondaryText }]}>{error}</Text>
                {onRetry ? (
                  <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {searchMenuVisible ? (
              <NativeCollectionSearchMenu
                assetBaseUrl={assetBaseUrl}
                onFilterPress={appendFilter}
                textColor={palette.text}
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={searchMenuVisible ? null : (
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#34807d" size="large" />
                <Text style={[styles.emptyTitle, { color: palette.text }]}>Loading your collection…</Text>
              </>
            ) : !error ? (
              <>
                <Text style={[styles.emptyTitle, { color: palette.text }]}>No Pokémon found</Text>
                <Text style={[styles.emptyBody, { color: palette.secondaryText }]}>Try another search or tag.</Text>
              </>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <CollectionParityCard
            assetBaseUrl={assetBaseUrl}
            card={item}
            cardWidth={cardWidth}
            onPressCard={onCardPress}
            onLongPressCard={onCardLongPress}
            selected={selectedIds.has(item.id)}
            theme={theme}
          />
        )}
      />

      {selectedIds.size === 0 ? <Pressable
        accessibilityLabel={sortLabel}
        accessibilityRole="button"
        onPress={onSortPress}
        style={styles.sortAnchor}
      >
        <View style={[styles.sortCircle, styles.sortTypeCircle]}>
          <View style={styles.sortInnerRing} />
          <Image
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, sortIconPath) }}
            style={styles.sortTypeImage}
          />
        </View>
        <View style={[styles.sortCircle, styles.sortModeCircle]}>
          <View style={styles.sortModeInnerRing} />
          <Image
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/sorting/arrow.png') }}
            style={[
              styles.sortArrowImage,
              sortDirection === 'descending' ? styles.sortArrowDescending : null,
            ]}
          />
        </View>
      </Pressable> : null}

      {selectedIds.size === 0 ? <Pressable
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
      </Pressable> : null}

      {selectedIds.size > 0 && onSelectionActionPress ? (
        <View pointerEvents="box-none" style={styles.selectionActionContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={onSelectionActionPress}
            style={styles.selectionActionButton}
          >
            <Text style={styles.selectionActionText}>
              {selectionAction === 'add' ? '+' : '◆'} {selectionAction === 'add' ? 'Add' : 'Organize'} ({selectedIds.size})
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 2,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabText: { fontSize: 11, fontWeight: '800' },
  tabSubtext: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  activeUnderline: {
    position: 'absolute',
    bottom: -10,
    width: 100,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: 92,
  },
  gridRow: { gap: GRID_GAP },
  collectionControls: { alignItems: 'center', paddingBottom: 6 },
  activeTagChip: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffd45a',
    borderRadius: 999,
    paddingLeft: 9,
    paddingRight: 5,
    paddingVertical: 3,
  },
  tagStar: { marginRight: 3 },
  tagDot: {
    width: 9,
    height: 9,
    marginRight: 2,
    borderRadius: 5,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  activeTagText: { fontSize: 14.5, fontWeight: '900' },
  clearTag: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 13,
    backgroundColor: '#ffd45a',
  },
  clearTagText: { color: '#111', fontSize: 18, fontWeight: '900', lineHeight: 19 },
  errorCard: {
    width: '92%',
    gap: 7,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ef5b72',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(239, 91, 114, 0.12)',
  },
  errorTitle: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  errorBody: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  retryButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ef5b72',
  },
  retryButtonText: { color: '#fff', fontWeight: '800' },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  card: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
  },
  selectedCard: { borderRadius: 8, backgroundColor: '#34807d' },
  cardTopLine: { width: '100%', height: 20, alignItems: 'center', justifyContent: 'center' },
  cpDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  cpLabel: { fontSize: 10, lineHeight: 12 },
  cpValue: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  hidden: { opacity: 0 },
  priorityStar: { position: 'absolute', top: -2, right: 4 },
  imageStage: {
    width: '65%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  luckyBackground: { position: 'absolute', width: '100%', height: '100%', opacity: 0.85 },
  pokemonImage: { width: '100%', height: '100%' },
  maxBadge: {
    position: 'absolute',
    top: '10%',
    right: '8%',
    width: '30%',
    height: '30%',
  },
  purifiedBadge: {
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '20%',
    height: '20%',
  },
  dexNumber: { minHeight: 11, fontSize: 8.5, lineHeight: 10 },
  typeIcons: { minHeight: 9, flexDirection: 'row', justifyContent: 'center', gap: 3 },
  typeIcon: { width: 7, height: 7 },
  name: {
    minHeight: 28,
    maxWidth: '100%',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },
  sortAnchor: {
    position: 'absolute',
    right: 7,
    bottom: 14,
    zIndex: 20,
    height: 63,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#34807d',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
  sortTypeCircle: { width: 62, height: 62 },
  sortModeCircle: { width: 31, height: 31, marginLeft: -16 },
  sortInnerRing: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderWidth: 1.5,
    borderColor: '#b4fea7',
    borderRadius: 999,
  },
  sortModeInnerRing: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderWidth: 1,
    borderColor: '#b4fea7',
    borderRadius: 999,
  },
  sortTypeImage: { width: 30, height: 30 },
  sortArrowImage: { width: 15, height: 15 },
  sortArrowDescending: { transform: [{ rotate: '180deg' }] },
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
  selectionActionContainer: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    left: 0,
    zIndex: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectionActionButton: {
    width: '100%',
    maxWidth: 520,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7cbcff',
    borderRadius: 14,
    backgroundColor: '#007bff',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  selectionActionText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
