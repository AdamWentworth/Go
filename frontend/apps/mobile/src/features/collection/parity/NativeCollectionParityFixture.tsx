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
  theme?: CollectionParityTheme;
};

const LIGHT = {
  background: '#f8fff9',
  text: '#405753',
  secondaryText: '#4b625e',
  search: '#e7f3df',
  searchText: '#405753',
  selected: '#e3f7dc',
};

const DARK = {
  background: webCssVarTokens.colors.bgApp,
  text: webCssVarTokens.colors.textPrimary,
  secondaryText: webCssVarTokens.colors.textSecondary,
  search: '#fff',
  searchText: '#111',
  selected: '#34807d',
};

const toAssetUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const CollectionParityCard = ({
  assetBaseUrl,
  card,
  theme,
}: {
  assetBaseUrl: string;
  card: CollectionParityCardFixture;
  theme: CollectionParityTheme;
}) => {
  const palette = theme === 'light' ? LIGHT : DARK;
  return (
    <Pressable
      accessibilityLabel={`View ${card.name}`}
      accessibilityRole="button"
      style={styles.card}
      testID={`parity-card-${card.id}`}
    >
      <View style={styles.cardTopLine}>
        <Text style={[styles.cp, { color: palette.text }]}>
          {card.cp == null ? '' : `CP ${card.cp}`}
        </Text>
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
        <View
          pointerEvents="none"
          style={[
            styles.statusGlow,
            { backgroundColor: theme === 'light' ? '#dceee6' : '#143a6b' },
          ]}
        />
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
        {card.maxBadgePath ? (
          <Image
            accessibilityLabel="Gigantamax"
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, card.maxBadgePath) }}
            style={styles.maxBadge}
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
  theme = 'dark',
}: NativeCollectionParityFixtureProps) => {
  const { width } = useWindowDimensions();
  const palette = theme === 'light' ? LIGHT : DARK;
  const columns = width < 481 ? 3 : width < 1024 ? 6 : 9;

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
            (FAVORITES)
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
        contentContainerStyle={styles.listContent}
        data={cards}
        key={columns}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        ListHeaderComponent={(
          <View style={styles.collectionControls}>
            <View style={[styles.searchPill, { backgroundColor: palette.search }]}>
              <Text style={[styles.searchIcon, { color: palette.searchText }]}>⌕</Text>
              <TextInput
                accessibilityLabel="Search"
                editable={false}
                placeholder="Search"
                placeholderTextColor={palette.searchText}
                style={[styles.searchInput, { color: palette.searchText }]}
              />
            </View>
            <View style={styles.activeTagChip}>
              <Text accessibilityLabel="Favorites tag" style={styles.tagStar}>★</Text>
              <Text style={styles.activeTagText}>{activeTag}</Text>
              <View accessibilityLabel={`Clear ${activeTag} tag filter`} style={styles.clearTag}>
                <Text style={styles.clearTagText}>×</Text>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <CollectionParityCard
            assetBaseUrl={assetBaseUrl}
            card={item}
            theme={theme}
          />
        )}
      />

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
  listContent: { flexGrow: 1, paddingBottom: 92 },
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
  searchIcon: { marginRight: 2, fontSize: 18, fontWeight: '700' },
  searchInput: { flexGrow: 0, minWidth: 56, padding: 0, fontSize: 14 },
  activeTagChip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffcc00',
    borderRadius: 24,
    paddingLeft: 10,
    paddingRight: 5,
    backgroundColor: '#5a4810',
  },
  tagStar: { color: '#ffcc00', fontSize: 19, marginRight: 7 },
  activeTagText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  clearTag: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 14,
    backgroundColor: '#ffcc00',
  },
  clearTagText: { color: '#111', fontSize: 20, fontWeight: '900', lineHeight: 21 },
  card: {
    flex: 1,
    minWidth: 0,
    maxWidth: '33.3333%',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
  },
  cardTopLine: { width: '100%', height: 20, alignItems: 'center', justifyContent: 'center' },
  cp: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
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
    opacity: 0.45,
  },
  locationBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 4,
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
  dexNumber: { minHeight: 13, fontSize: 10, lineHeight: 12 },
  typeIcons: { minHeight: 9, flexDirection: 'row', justifyContent: 'center', gap: 3 },
  typeIcon: { width: 8, height: 8 },
  name: {
    minHeight: 28,
    maxWidth: '100%',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'center',
  },
  actionMenuAnchor: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
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
