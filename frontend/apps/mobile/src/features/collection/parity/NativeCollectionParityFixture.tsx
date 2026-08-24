import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
import type {
  CollectionParityCardFixture,
  CollectionParityTheme,
} from './collectionParityFixtures';
import { COLLECTION_PARITY_FIXTURES } from './collectionParityFixtures';

type NativeCollectionParityFixtureProps = {
  assetBaseUrl?: string;
  activeTag?: string;
  cards?: CollectionParityCardFixture[];
  collectionCount?: number;
  customTagColor?: string;
  tagCanClear?: boolean;
  tagTone?: 'caught' | 'trade' | 'favorites' | 'wanted' | 'most-wanted' | 'custom';
  theme?: CollectionParityTheme;
};

const LIGHT = {
  background: '#f8fff9',
  text: '#405753',
  secondaryText: '#4b625e',
  search: '#e7f3df',
  searchText: '#405753',
  tagText: '#405753',
};

const DARK = {
  background: webCssVarTokens.colors.bgApp,
  text: webCssVarTokens.colors.textPrimary,
  secondaryText: webCssVarTokens.colors.textSecondary,
  search: '#fff',
  searchText: '#111',
  tagText: '#fff',
};

const GRID_GAP = 8;
const GRID_HORIZONTAL_PADDING = 8;

const OWNERSHIP_GLOW: Record<
  NonNullable<CollectionParityCardFixture['ownership']>,
  string
> = {
  caught: '#0077ff',
  trade: '#28a745',
  wanted: '#dc3545',
};

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

const toAssetUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const CollectionParityCard = ({
  assetBaseUrl,
  card,
  cardWidth,
  theme,
}: {
  assetBaseUrl: string;
  card: CollectionParityCardFixture;
  cardWidth: number;
  theme: CollectionParityTheme;
}) => {
  const palette = theme === 'light' ? LIGHT : DARK;
  return (
    <Pressable
      accessibilityLabel={`View ${card.name}`}
      accessibilityRole="button"
      style={[styles.card, { width: cardWidth }]}
      testID={`parity-card-${card.id}`}
    >
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
          <Text
            accessibilityLabel={card.favorite ? 'Favorite' : 'Most Wanted'}
            style={[
              styles.priorityStar,
              { color: card.favorite ? '#ffcc00' : '#ff704d' },
            ]}
          >
            ★
          </Text>
        ) : null}
      </View>
      <View style={styles.imageStage}>
        {card.ownership ? (
          <View
            pointerEvents="none"
            style={[
              styles.statusGlow,
              { backgroundColor: OWNERSHIP_GLOW[card.ownership] },
            ]}
          />
        ) : null}
        {card.locationBackgroundPath ? (
          <Image
            accessibilityElementsHidden
            resizeMode="cover"
            source={{ uri: toAssetUrl(assetBaseUrl, card.locationBackgroundPath) }}
            style={styles.locationBackground}
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
};

export const NativeCollectionParityFixture = ({
  assetBaseUrl = 'https://pokegonexus.com',
  activeTag = 'Favorites',
  cards = COLLECTION_PARITY_FIXTURES,
  collectionCount = 168,
  customTagColor = TAG_TONES.custom.accent,
  tagCanClear = true,
  tagTone = 'favorites',
  theme = 'dark',
}: NativeCollectionParityFixtureProps) => {
  const { width } = useWindowDimensions();
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

  return (
    <View
      style={[styles.screen, { backgroundColor: palette.background }]}
      testID="native-collection-parity-fixture"
    >
      <View
        accessibilityRole="tablist"
        style={[styles.header, { backgroundColor: palette.background }]}
      >
        <Pressable accessibilityRole="tab" style={styles.tab}>
          <Text style={[styles.tabText, { color: palette.secondaryText }]}>TAGS</Text>
          <Text style={[styles.tabSubtext, { color: palette.secondaryText }]}>
            ({activeTag.toUpperCase()})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          style={styles.tab}
        >
          <Text style={[styles.tabText, { color: palette.text }]}>POKÉMON</Text>
          <Text style={[styles.tabSubtext, { color: palette.text }]}>
            ({collectionCount})
          </Text>
          <View style={[styles.activeUnderline, { backgroundColor: palette.text }]} />
        </Pressable>
        <Pressable accessibilityRole="tab" style={styles.tab}>
          <Text style={[styles.tabText, { color: palette.secondaryText }]}>WISHLIST</Text>
        </Pressable>
      </View>

      <FlatList
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        data={cards}
        key={columns}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        ListHeaderComponent={(
          <View style={styles.collectionControls}>
            <View style={[styles.searchPill, { backgroundColor: palette.search }]}>
              <Image
                accessibilityElementsHidden
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/search_icon.png') }}
                style={[styles.searchIcon, { tintColor: palette.searchText }]}
              />
              <TextInput
                accessibilityLabel="Search"
                editable={false}
                placeholder="Search"
                placeholderTextColor={palette.searchText}
                style={[styles.searchInput, { color: palette.searchText }]}
              />
            </View>
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
                <Text accessibilityLabel="Favorites tag" style={styles.tagStar}>★</Text>
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
                <View
                  accessibilityLabel={`Clear ${activeTag} tag filter`}
                  style={[styles.clearTag, { backgroundColor: tagColors.accent }]}
                >
                  <Text style={[styles.clearTagText, { color: tagColors.contrast }]}>×</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <CollectionParityCard
            assetBaseUrl={assetBaseUrl}
            card={item}
            cardWidth={cardWidth}
            theme={theme}
          />
        )}
      />

      <View
        accessibilityLabel="Sort by Pokédex number ascending"
        accessible
        pointerEvents="none"
        style={styles.sortAnchor}
      >
        <View style={[styles.sortCircle, styles.sortTypeCircle]}>
          <View style={styles.sortInnerRing} />
          <Image
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/sorting/number.png') }}
            style={styles.sortTypeImage}
          />
        </View>
        <View style={[styles.sortCircle, styles.sortModeCircle]}>
          <View style={styles.sortModeInnerRing} />
          <Image
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/sorting/arrow.png') }}
            style={styles.sortArrowImage}
          />
        </View>
      </View>

      <View pointerEvents="none" style={styles.actionMenuAnchor}>
        <Image
          accessibilityLabel="Open action menu"
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/balls/pokeball.png') }}
          style={styles.actionMenuBall}
        />
      </View>
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
  collectionControls: { alignItems: 'center', paddingTop: 18, paddingBottom: 6 },
  searchPill: {
    width: '80%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  searchIcon: { width: 17, height: 17, marginRight: 5 },
  searchInput: { flexGrow: 0, minWidth: 56, padding: 0, fontSize: 14 },
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
  tagStar: { color: '#ffd21c', fontSize: 16, marginRight: 3 },
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
  card: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
  },
  cardTopLine: { width: '100%', height: 20, alignItems: 'center', justifyContent: 'center' },
  cpDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  cpLabel: { fontSize: 10, lineHeight: 12 },
  cpValue: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  hidden: { opacity: 0 },
  priorityStar: { position: 'absolute', top: -2, right: 4, fontSize: 18 },
  imageStage: {
    width: '65%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGlow: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    width: '76%',
    height: '76%',
    borderRadius: 999,
    opacity: 0.22,
  },
  locationBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    opacity: 0.68,
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
