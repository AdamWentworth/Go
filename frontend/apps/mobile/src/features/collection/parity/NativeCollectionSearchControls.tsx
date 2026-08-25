import { useRef } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type FilterSection = 'Variants' | 'Qualities' | 'Rarity' | 'Region' | 'Types';

const FILTER_SECTIONS: Record<FilterSection, string[]> = {
  Variants: ['Shiny', 'Costume', 'Shadow', 'Mega', 'Dynamax', 'Gigantamax'],
  Qualities: ['Lucky', 'XXS', 'XXL', '100%'],
  Rarity: ['Legendary', 'Mythical', 'Regional'],
  Region: ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'],
  Types: ['Normal', 'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark', 'Fairy'],
};

const FILTER_ASSETS: Record<string, string> = {
  Shiny: '/images/shiny_search.png',
  Costume: '/images/costume_search.png',
  Shadow: '/images/shadow_search.png',
  Mega: '/images/mega_search.png',
  Dynamax: '/images/dynamax_search.png',
  Gigantamax: '/images/gigantamax_search.png',
  Lucky: '/images/lucky-icon.png',
  XXS: '/images/xxs.png',
  XXL: '/images/xxl.png',
  '100%': '/images/appraisal_04.png',
  Legendary: '/images/legendary_search.png',
  Mythical: '/images/mythical_search.png',
  Regional: '/images/regional_search.png',
};

const FILTER_SURFACES: Record<string, string> = {
  Shiny: '#efcf78',
  Costume: '#e4ade4',
  Shadow: '#c39eeb',
  Mega: '#d15382',
  Dynamax: '#de0c87',
  Gigantamax: '#a70e68',
  Lucky: '#eac89b',
  XXS: '#add8e6',
  XXL: '#90ee90',
  '100%': '#f29ead',
  Legendary: '#595566',
  Mythical: '#e89beb',
  Regional: '#85e0fd',
};

const REGION_GRADIENTS: Record<string, readonly [string, string, string]> = {
  Kanto: ['#ee4b2b', '#3b4cca', '#ffde00'],
  Johto: ['#d4af37', '#c0c0c0', '#9bd3e0'],
  Hoenn: ['#aa0000', '#0a6dc2', '#2e8b57'],
  Sinnoh: ['#8fd2f5', '#e1b8d8', '#a7a7a7'],
  Unova: ['#f5f5f5', '#1c1c1c', '#f5f5f5'],
  Kalos: ['#637cff', '#ff6b81', '#b68fcc'],
  Alola: ['#fdb813', '#2d2d70', '#eaadea'],
  Galar: ['#0074b8', '#d80040', '#b9a0e7'],
  Hisui: ['#a1a1a1', '#ae8baf', '#e3d1a7'],
  Paldea: ['#b80000', '#7f3fbf', '#ffd966'],
};

const toAssetUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const RegionGradient = ({ name }: { name: string }) => {
  const colors = REGION_GRADIENTS[name];
  if (!colors) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id={`region-${name}`} x1="0%" x2="100%" y1="0%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="50%" stopColor={colors[1]} />
            <Stop offset="100%" stopColor={colors[2]} />
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#region-${name})`} height="100%" width="100%" />
      </Svg>
    </View>
  );
};

const FilterTile = ({
  assetBaseUrl,
  filter,
  onPress,
  section,
  textColor,
}: {
  assetBaseUrl: string;
  filter: string;
  onPress: () => void;
  section: FilterSection;
  textColor: string;
}) => {
  const assetPath = section === 'Region'
    ? `/images/${filter.toLowerCase()}_search.png`
    : section === 'Types'
      ? `/images/types/${filter.toLowerCase()}.png`
      : FILTER_ASSETS[filter];
  return (
    <Pressable
      accessibilityLabel={`Filter by ${filter}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.filterTile, pressed ? styles.pressed : null]}
      testID={`native-collection-filter-${filter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
    >
      <View style={[
        styles.filterImageCircle,
        section !== 'Types' && section !== 'Region'
          ? { backgroundColor: FILTER_SURFACES[filter] ?? '#85e0fd' }
          : null,
      ]}>
        {section === 'Region' ? <RegionGradient name={filter} /> : null}
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, assetPath) }}
          style={section === 'Types' ? styles.typeFilterImage : styles.filterImage}
        />
      </View>
      <Text numberOfLines={1} style={[styles.filterLabel, { color: textColor }]}>{filter}</Text>
    </Pressable>
  );
};

export const NativeCollectionSearchMenu = ({
  assetBaseUrl,
  onFilterPress,
  textColor,
}: {
  assetBaseUrl: string;
  onFilterPress: (filter: string) => void;
  textColor: string;
}) => (
  <View accessibilityLabel="Pokémon search filters" style={styles.searchMenu}>
    {(Object.keys(FILTER_SECTIONS) as FilterSection[]).map((section) => (
      <View key={section} style={styles.filterSection}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: textColor }]}>
          {section}
        </Text>
        <View style={styles.filterGrid}>
          {FILTER_SECTIONS[section].map((filter) => (
            <FilterTile
              assetBaseUrl={assetBaseUrl}
              filter={filter}
              key={filter}
              onPress={() => onFilterPress(filter)}
              section={section}
              textColor={textColor}
            />
          ))}
        </View>
      </View>
    ))}
  </View>
);

export const NativeCollectionSearchControls = ({
  assetBaseUrl,
  inputBackground,
  inputTextColor,
  menuVisible,
  onMenuVisibleChange,
  onQueryChange,
  onToggleEvolutionaryLine,
  query,
  showEvolutionaryLine,
  textColor,
}: {
  assetBaseUrl: string;
  inputBackground: string;
  inputTextColor: string;
  menuVisible: boolean;
  onMenuVisibleChange: (visible: boolean) => void;
  onQueryChange: (query: string) => void;
  onToggleEvolutionaryLine: () => void;
  query: string;
  showEvolutionaryLine: boolean;
  textColor: string;
}) => {
  const inputRef = useRef<TextInput>(null);
  const expanded = menuVisible || Boolean(query.trim());
  const closeSearch = () => {
    onMenuVisibleChange(false);
    onQueryChange('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  };
  const clearSearch = () => {
    onQueryChange('');
    onMenuVisibleChange(true);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchShell}>
        {expanded ? (
          <Pressable
            accessibilityLabel="Close Pokémon search"
            accessibilityRole="button"
            hitSlop={10}
            onPress={closeSearch}
            style={styles.backButton}
          >
            <Image
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/arrow_right.png') }}
              style={[styles.backIcon, { tintColor: textColor }]}
            />
          </Pressable>
        ) : null}
        <View
          style={[
            styles.searchInputWrapper,
            expanded ? styles.searchInputWrapperExpanded : null,
            { backgroundColor: inputBackground },
          ]}
        >
          {expanded ? (
            <Image
              accessibilityElementsHidden
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/search_icon.png') }}
              style={[styles.searchIconLeft, { tintColor: inputTextColor }]}
            />
          ) : null}
          <TextInput
            accessibilityLabel="Search Pokémon"
            autoCapitalize="none"
            onChangeText={(value) => {
              onQueryChange(value);
              onMenuVisibleChange(false);
            }}
            onFocus={() => onMenuVisibleChange(true)}
            ref={inputRef}
            style={[
              styles.searchInput,
              expanded ? styles.searchInputExpanded : null,
              { color: inputTextColor },
            ]}
            value={query}
          />
          {!expanded ? (
            <View pointerEvents="none" style={styles.placeholder}>
              <Image
                accessibilityElementsHidden
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/search_icon.png') }}
                style={[styles.placeholderIcon, { tintColor: '#666666' }]}
              />
              <Text style={styles.placeholderText}>Search</Text>
            </View>
          ) : null}
          {query.trim() ? (
            <Pressable
              accessibilityLabel="Clear Pokémon search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={clearSearch}
              style={styles.clearButton}
            >
              <View style={styles.clearDivider} />
              <Image
                accessibilityElementsHidden
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/close.png') }}
                style={styles.clearIcon}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {query.trim() ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: showEvolutionaryLine }}
          onPress={onToggleEvolutionaryLine}
          style={styles.evolutionToggle}
        >
          <View style={[styles.evolutionCheckbox, { borderColor: textColor }]}>
            {showEvolutionaryLine ? <Text style={[styles.checkmark, { color: textColor }]}>✓</Text> : null}
          </View>
          <Text style={[styles.evolutionLabel, { color: textColor }]}>SHOW EVOLUTIONARY LINE</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: { width: '100%', alignItems: 'center', paddingVertical: 15 },
  searchShell: { position: 'relative', width: '80%', maxWidth: '90%', height: 40 },
  backButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  backIcon: { width: 18, height: 18, transform: [{ scaleX: -1 }] },
  searchInputWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
  },
  searchInputWrapperExpanded: { left: 32 },
  searchInput: { width: '100%', height: '100%', paddingHorizontal: 20, fontSize: 14 },
  searchInputExpanded: { paddingLeft: 35, paddingRight: 60 },
  searchIconLeft: { position: 'absolute', left: 15, width: 17, height: 17, opacity: 0.5 },
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { width: 17, height: 17, marginRight: 2, opacity: 0.5 },
  placeholderText: { color: '#666666', fontSize: 14 },
  clearButton: {
    position: 'absolute',
    top: 0,
    right: 4,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDivider: { position: 'absolute', top: 8, bottom: 8, left: 0, width: 1, backgroundColor: '#00000033' },
  clearIcon: { width: 16, height: 16, tintColor: '#333333', opacity: 0.8 },
  evolutionToggle: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  evolutionCheckbox: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 8, marginRight: 4 },
  checkmark: { fontSize: 10, fontWeight: '800', lineHeight: 11 },
  evolutionLabel: { fontSize: 8 },
  searchMenu: { width: '100%', paddingHorizontal: 8, paddingBottom: 80 },
  filterSection: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8, fontSize: 16, fontWeight: '700' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  filterTile: { width: '25%', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  filterImageCircle: { overflow: 'hidden', width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 3, borderRadius: 21 },
  filterImage: { width: 27, height: 27 },
  typeFilterImage: { width: '100%', height: '100%' },
  filterLabel: { maxWidth: '100%', fontSize: 13, textAlign: 'center' },
});
