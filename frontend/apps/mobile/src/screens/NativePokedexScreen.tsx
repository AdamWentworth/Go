import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  NativePokedexCategory,
  NativePokedexEntry,
  NativePokedexFacet,
} from '../features/tools/nativePokedexModel';
import { filterNativePokedexEntries } from '../features/tools/nativePokedexModel';

type Props = {
  assetBaseUrl: string;
  entries: NativePokedexEntry[];
  error?: string | null;
  isLoading?: boolean;
  onBack: () => void;
  onOpenEntry: (entry: NativePokedexEntry) => void;
  onRetry: () => void;
};

type CategoryDefinition = {
  accent: string;
  icons: string[];
  label: string;
  value: NativePokedexCategory;
};

type FacetDefinition = {
  accent: string;
  icon: string;
  label: string;
  value: NativePokedexFacet;
};

const REGIONS = [
  { accent: '#ee4b2b', generation: 1, label: 'Kanto', starters: [1, 4, 7] },
  { accent: '#d4af37', generation: 2, label: 'Johto', starters: [152, 155, 158] },
  { accent: '#aa3640', generation: 3, label: 'Hoenn', starters: [252, 255, 258] },
  { accent: '#7a9fbd', generation: 4, label: 'Sinnoh', starters: [387, 390, 393] },
  { accent: '#6657ad', generation: 5, label: 'Unova', starters: [495, 498, 501] },
  { accent: '#637cff', generation: 6, label: 'Kalos', starters: [650, 653, 656] },
  { accent: '#e7a50d', generation: 7, label: 'Alola', starters: [722, 725, 728] },
  { accent: '#087bb8', generation: 8, label: 'Galar', starters: [810, 813, 816] },
  { accent: '#8997a4', generation: 9, label: 'Hisui', starters: [722, 155, 501] },
  { accent: '#a942bc', generation: 10, label: 'Paldea', starters: [906, 909, 912] },
] as const;

const BASE_CATEGORIES: CategoryDefinition[] = [
  { value: 'pokemon', label: 'Pokémon', icons: ['/images/pokedex-icon.png'], accent: '#1699c9' },
  { value: 'shiny', label: 'Shiny', icons: ['/images/shiny_icon.png'], accent: '#f4a229' },
  { value: 'shadow', label: 'Shadow', icons: ['/images/shadow_icon.png'], accent: '#8845b8' },
  { value: 'costume', label: 'Costume', icons: ['/images/costume_icon.png'], accent: '#ef6a8a' },
  { value: 'mega', label: 'Mega', icons: ['/images/mega.png'], accent: '#b551d6' },
  { value: 'dynamax', label: 'Dynamax', icons: ['/images/dynamax-icon.png'], accent: '#d94973' },
  { value: 'gigantamax', label: 'Gigantamax', icons: ['/images/gigantamax-icon.png'], accent: '#d73442' },
  { value: 'fusion', label: 'Fusion', icons: ['/images/fusion_1.png', '/images/fusion_2.png'], accent: '#416ed8' },
];

const COMBO_CATEGORIES: CategoryDefinition[] = [
  { value: 'shiny shadow', label: 'Shiny Shadow', icons: ['/images/shiny_icon.png', '/images/shadow_icon.png'], accent: '#8845b8' },
  { value: 'shiny costume', label: 'Shiny Costume', icons: ['/images/shiny_icon.png', '/images/costume_icon.png'], accent: '#e89a2f' },
  { value: 'shadow costume', label: 'Shadow Costume', icons: ['/images/shadow_icon.png', '/images/costume_icon.png'], accent: '#5a348f' },
  { value: 'shiny mega', label: 'Shiny Mega', icons: ['/images/shiny_icon.png', '/images/mega.png'], accent: '#c768cb' },
  { value: 'shiny dynamax', label: 'Shiny Dynamax', icons: ['/images/shiny_icon.png', '/images/dynamax-icon.png'], accent: '#e76478' },
  { value: 'shiny gigantamax', label: 'Shiny Gigantamax', icons: ['/images/shiny_icon.png', '/images/gigantamax-icon.png'], accent: '#df4651' },
  { value: 'shiny fusion', label: 'Shiny Fusion', icons: ['/images/shiny_icon.png', '/images/fusion_1.png'], accent: '#6676e8' },
];

const BASE_FACETS: FacetDefinition[] = [
  { value: 'lucky', label: 'Lucky', icon: '/images/lucky-icon.png', accent: '#e36c2f' },
  { value: 'purified', label: 'Purified', icon: '/images/purified.png', accent: '#16aeb7' },
  { value: 'xxs', label: 'XXS', icon: '/images/xxs.png', accent: '#4b7be8' },
  { value: 'xxl', label: 'XXL', icon: '/images/xxl.png', accent: '#1767b7' },
  { value: 'perfect', label: '100%', icon: '/images/appraisal_04.png', accent: '#e3303d' },
];

const ADVANCED_FACETS: FacetDefinition[] = [
  ...BASE_FACETS.slice(0, 3),
  { value: 'xs', label: 'XS', icon: '/images/height.png', accent: '#1d4d95' },
  { value: 'xl', label: 'XL', icon: '/images/height.png', accent: '#1a7cc6' },
  ...BASE_FACETS.slice(3),
  { value: 'male', label: 'Male', icon: '/images/male-icon.png', accent: '#2c78d8' },
  { value: 'female', label: 'Female', icon: '/images/female-icon.png', accent: '#ca4bb6' },
];

const DARK_ON_LIGHT_FACET_ICONS = new Set([
  '/images/appraisal_04.png',
  '/images/height.png',
  '/images/lucky-icon.png',
  '/images/xxl.png',
  '/images/xxs.png',
]);

const absoluteUri = (base: string, value: string | null): string | null => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

const entryIsRegistered = (entry: NativePokedexEntry, category: NativePokedexCategory): boolean => (
  category === 'pokemon' ? entry.registeredSpecies : entry.registered
);

export const NativePokedexScreen = ({ assetBaseUrl, entries, error = null, isLoading = false, onBack, onOpenEntry, onRetry }: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 5 : width >= 520 ? 4 : 3;
  const [advanced, setAdvanced] = useState(false);
  const [category, setCategory] = useState<NativePokedexCategory>('pokemon');
  const [facets, setFacets] = useState<NativePokedexFacet[]>([]);
  const [generation, setGeneration] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const categories = advanced ? [...BASE_CATEGORIES, ...COMBO_CATEGORIES] : BASE_CATEGORIES;
  const qualityFacets = advanced ? ADVANCED_FACETS : BASE_FACETS;
  const activeCategory = categories.find(({ value }) => value === category) ?? BASE_CATEGORIES[0];
  const filtered = useMemo(() => filterNativePokedexEntries({ category, entries, facets, generation, query }), [category, entries, facets, generation, query]);
  const categoryEntries = useMemo(() => filterNativePokedexEntries({ category, entries, facets, generation: null, query: '' }), [category, entries, facets]);
  const registeredCount = categoryEntries.filter((entry) => entryIsRegistered(entry, category)).length;
  const toggleFacet = (value: NativePokedexFacet) => setFacets((current) => current.includes(value) ? current.filter((facet) => facet !== value) : [...current, value]);
  const selectCategory = (value: NativePokedexCategory) => {
    setCategory(value);
    if (value.includes('shadow')) setFacets((current) => current.filter((facet) => facet !== 'lucky' && facet !== 'purified'));
  };
  const toggleAdvanced = () => {
    setAdvanced((current) => {
      if (current && !BASE_CATEGORIES.some(({ value }) => value === category)) setCategory('pokemon');
      if (current) setFacets((selected) => selected.filter((facet) => BASE_FACETS.some(({ value }) => value === facet)));
      return !current;
    });
  };
  const regionCards = REGIONS.map((region) => {
    const regionEntries = filterNativePokedexEntries({ category, entries, facets, generation: region.generation, query: '' });
    const previews = [...region.starters.map((dex) => regionEntries.find(({ pokedexNumber }) => pokedexNumber === dex)).filter((entry): entry is NativePokedexEntry => Boolean(entry)), ...regionEntries].filter((entry, index, list) => list.findIndex(({ id }) => id === entry.id) === index).slice(0, 3);
    return { ...region, entries: regionEntries, previews, registered: regionEntries.filter((entry) => entryIsRegistered(entry, category)).length };
  }).filter(({ entries: regionEntries }) => regionEntries.length > 0);

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-pokedex-screen">
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
        data={generation == null ? [] : filtered}
        key={columns}
        keyExtractor={(entry) => entry.id}
        numColumns={columns}
        ListHeaderComponent={<View>
          <View style={styles.topbar}>
            <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}><Text style={[styles.backText, light && styles.textLight]}>‹</Text></Pressable>
            <Image source={{ uri: absoluteUri(assetBaseUrl, '/images/pokedex-icon.png') ?? undefined }} style={styles.headerIcon} />
            <View style={styles.headerCopy}><Text style={styles.eyebrow}>TRAINER REFERENCE</Text><Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Pokédex</Text><Text style={[styles.headerDetail, light && styles.mutedLight]}>Explore every released species, form, and collectible variant.</Text></View>
          </View>
          <View style={styles.headerTools}>
            <Text style={[styles.registrationTotal, light && styles.textLight]}>Registered: <Text style={{ color: activeCategory.accent }}>{registeredCount}</Text> / {categoryEntries.length}</Text>
            <Pressable accessibilityLabel="Advanced Pokédex filters" accessibilityRole="switch" accessibilityState={{ checked: advanced }} onPress={toggleAdvanced} style={[styles.advanced, light && styles.chipLight, advanced && styles.advancedActive]}><Text style={[styles.advancedText, light && styles.textLight, advanced && styles.activeText]}>Advanced</Text><View style={[styles.switchTrack, advanced && styles.switchTrackActive]}><View style={[styles.switchThumb, advanced && styles.switchThumbActive]} /></View></Pressable>
          </View>
          <ScrollView accessibilityLabel="Pokédex variant category" contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((definition) => { const active = category === definition.value; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={definition.value} onPress={() => selectCategory(definition.value)} style={[styles.categoryChip, light && styles.chipLight, active && { borderColor: definition.accent, backgroundColor: `${definition.accent}35` }]}><View style={styles.iconStack}>{definition.icons.map((icon) => <Image key={icon} source={{ uri: absoluteUri(assetBaseUrl, icon) ?? undefined }} style={styles.categoryIcon} />)}</View><Text style={[styles.chipText, light && styles.textLight, active && { color: definition.accent }]}>{definition.label}</Text></Pressable>; })}
          </ScrollView>
          <ScrollView accessibilityLabel="Pokédex quality facets" contentContainerStyle={styles.qualityRail} horizontal showsHorizontalScrollIndicator={false}>
            {qualityFacets.map((facet) => { const active = facets.includes(facet.value); const disabled = category.includes('shadow') && (facet.value === 'lucky' || facet.value === 'purified'); return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active }} disabled={disabled} key={facet.value} onPress={() => toggleFacet(facet.value)} style={[styles.facetChip, light && styles.chipLight, active && { borderColor: facet.accent, backgroundColor: `${facet.accent}35` }, disabled && styles.disabled]}><Image source={{ uri: absoluteUri(assetBaseUrl, facet.icon) ?? undefined }} style={[styles.facetIcon, light && DARK_ON_LIGHT_FACET_ICONS.has(facet.icon) && styles.darkFacetIcon]} /><Text style={[styles.facetText, light && styles.textLight, active && { color: facet.accent }]}>{facet.label}</Text></Pressable>; })}
          </ScrollView>
          {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorTitle}>Pokédex unavailable</Text><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
          {isLoading ? <View style={styles.loading}><ActivityIndicator color="#299cf5" /><Text style={[styles.loadingText, light && styles.mutedLight]}>Opening Pokédex…</Text></View> : null}
          {!isLoading && !error && generation == null ? <View accessibilityLabel={`${activeCategory.label} regions`} style={styles.regions}>
            {regionCards.map((region) => { const complete = region.entries.length > 0 && region.registered >= region.entries.length; return <Pressable accessibilityLabel={`Open ${region.label}`} accessibilityRole="button" key={region.label} onPress={() => { setGeneration(region.generation); setQuery(''); }} style={[styles.regionCard, light && styles.regionCardLight, { borderColor: `${region.accent}bb` }]}><View style={styles.regionCopy}><Text style={[styles.regionName, light && styles.textLight]}>{region.label}</Text><Text style={[styles.regionStatus, { color: region.accent }]}>{complete ? 'Complete!' : 'In progress'}</Text><Text style={[styles.regionCount, light && styles.mutedLight]}>{region.registered} / {region.entries.length}</Text><View style={[styles.regionBadge, { backgroundColor: region.accent }]}><Text style={styles.regionBadgeText}>{complete ? '✓' : '!'}</Text></View></View><View style={styles.regionArt}>{region.previews.map((entry, index) => <View key={entry.id} style={[styles.regionPreview, { left: index * 48, zIndex: index + 1 }]}>{entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUri) ?? undefined }} style={styles.regionPokemon} /> : null}{entry.maxKind ? <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${entry.maxKind}.png`) ?? undefined }} style={styles.regionMaxIcon} /> : null}</View>)}</View></Pressable>; })}
            {regionCards.length === 0 ? <View style={styles.empty}><Text style={[styles.emptyTitle, light && styles.textLight]}>No regions match</Text><Text style={[styles.emptyText, light && styles.mutedLight]}>Try another category or clear a quality filter.</Text></View> : null}
          </View> : null}
          {generation != null ? <View style={styles.detailToolbar}><View style={styles.detailHeading}><Pressable accessibilityRole="button" onPress={() => { setGeneration(null); setQuery(''); }} style={[styles.regionsBack, light && styles.chipLight]}><Text style={[styles.regionsBackText, light && styles.textLight]}>‹ All regions</Text></Pressable><Text style={[styles.resultsTitle, light && styles.textLight]}>{REGIONS.find((region) => region.generation === generation)?.label} · {activeCategory.label}</Text><Text style={[styles.resultsDetail, light && styles.mutedLight]}>{filtered.filter((entry) => entryIsRegistered(entry, category)).length} / {filtered.length} registered</Text></View><TextInput accessibilityLabel="Search Pokédex" autoCapitalize="none" onChangeText={setQuery} placeholder="Pokémon or number" placeholderTextColor="#75838c" style={[styles.search, light && styles.searchLight]} value={query} /></View> : null}
        </View>}
        ListEmptyComponent={generation != null && !isLoading && !error ? <View style={styles.empty}><Text style={[styles.emptyTitle, light && styles.textLight]}>No Pokémon match</Text><Text style={[styles.emptyText, light && styles.mutedLight]}>Try another region, category, quality, or search term.</Text></View> : null}
        renderItem={({ item }) => <View style={[styles.cardCell, { width: `${100 / columns}%` }]}><Pressable accessibilityLabel={`Open ${item.name}`} accessibilityRole="button" onPress={() => onOpenEntry(item)} style={({ pressed }) => [styles.card, light && styles.cardLight, entryIsRegistered(item, category) && styles.cardRegistered, pressed && styles.pressed]}><View style={styles.imageStage}>{item.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, item.imageUri) ?? undefined }} style={styles.image} /> : null}{item.maxKind ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, `/images/${item.maxKind}.png`) ?? undefined }} style={styles.maxIcon} /> : null}{entryIsRegistered(item, category) ? <View style={styles.registered}><Text style={styles.registeredText}>✓</Text></View> : null}</View><Text numberOfLines={2} style={[styles.name, light && styles.textLight]}>{item.name}</Text><Text style={[styles.dex, light && styles.mutedLight]}>#{String(item.pokedexNumber).padStart(4, '0')}</Text></Pressable></View>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' }, textLight: { color: '#14232a' }, mutedLight: { color: '#5c6c74' },
  topbar: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515b', borderRadius: 22, backgroundColor: '#171d22' }, backLight: { borderColor: '#becbd2', backgroundColor: '#fff' }, backText: { marginTop: -4, color: '#fff', fontSize: 38 }, headerIcon: { width: 45, height: 45, resizeMode: 'contain' }, headerCopy: { minWidth: 0, flex: 1 }, eyebrow: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#fff', fontSize: 28, fontWeight: '900' }, headerDetail: { marginTop: 2, color: '#9ba9b0', fontSize: 10.5, lineHeight: 14 },
  headerTools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6, marginBottom: 12 }, registrationTotal: { color: '#fff', fontSize: 12, fontWeight: '800' }, advanced: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#45535c', borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#151b20' }, advancedActive: { borderColor: '#299cf5', backgroundColor: '#123c61' }, advancedText: { color: '#c2cbd0', fontSize: 10, fontWeight: '900' }, activeText: { color: '#fff' }, switchTrack: { width: 27, height: 16, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 2, backgroundColor: '#65727a' }, switchTrackActive: { backgroundColor: '#299cf5' }, switchThumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' }, switchThumbActive: { alignSelf: 'flex-end' },
  railContent: { gap: 7, paddingRight: 12, paddingBottom: 8 }, qualityRail: { gap: 7, paddingRight: 12, paddingBottom: 14 }, categoryChip: { minHeight: 58, minWidth: 72, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 1, borderColor: '#43515a', borderRadius: 12, paddingHorizontal: 10, backgroundColor: '#161c21' }, chipLight: { borderColor: '#bec9cf', backgroundColor: '#fff' }, iconStack: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, categoryIcon: { width: 23, height: 23, marginHorizontal: -2, resizeMode: 'contain' }, chipText: { color: '#bdc7cc', fontSize: 9.5, fontWeight: '900' }, facetChip: { minHeight: 42, minWidth: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: '#43515a', borderRadius: 999, paddingHorizontal: 10, backgroundColor: '#161c21' }, facetIcon: { width: 22, height: 22, resizeMode: 'contain' }, darkFacetIcon: { tintColor: '#26333a' }, facetText: { color: '#bdc7cc', fontSize: 9.5, fontWeight: '900' }, disabled: { opacity: 0.35 },
  regions: { gap: 10 }, regionCard: { minHeight: 124, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderRadius: 17, backgroundColor: '#141a1f' }, regionCardLight: { backgroundColor: '#fff' }, regionCopy: { width: 122, justifyContent: 'center', padding: 14 }, regionName: { color: '#fff', fontSize: 21, fontWeight: '900' }, regionStatus: { marginTop: 3, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, regionCount: { marginTop: 5, color: '#a4b0b6', fontSize: 12, fontWeight: '800' }, regionBadge: { position: 'absolute', right: 5, top: 8, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, regionBadgeText: { color: '#fff', fontWeight: '900' }, regionArt: { flex: 1, minWidth: 0, justifyContent: 'center' }, regionPreview: { position: 'absolute', width: 105, height: 105, alignItems: 'center', justifyContent: 'center' }, regionPokemon: { width: '90%', height: '90%' }, regionMaxIcon: { position: 'absolute', right: 3, top: 3, width: 29, height: 29, resizeMode: 'contain' },
  detailToolbar: { gap: 10, marginBottom: 8 }, detailHeading: { gap: 4 }, regionsBack: { alignSelf: 'flex-start', minHeight: 38, justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 999, paddingHorizontal: 13, backgroundColor: '#161c21' }, regionsBackText: { color: '#fff', fontSize: 11, fontWeight: '900' }, resultsTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, resultsDetail: { color: '#89989f', fontSize: 10 }, search: { minHeight: 48, borderWidth: 1, borderColor: '#46545d', borderRadius: 12, paddingHorizontal: 14, color: '#fff', backgroundColor: '#161c21', fontSize: 15 }, searchLight: { borderColor: '#b8c6cd', color: '#14232a', backgroundColor: '#fff' },
  cardCell: { padding: 4 }, card: { minHeight: 158, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#324149', borderRadius: 12, padding: 7, backgroundColor: '#151b20' }, cardLight: { borderColor: '#c2cdd3', backgroundColor: '#fff' }, cardRegistered: { borderColor: '#299cf5' }, imageStage: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, image: { width: '86%', height: '86%' }, maxIcon: { position: 'absolute', top: '5%', right: '5%', width: '23%', height: '23%' }, registered: { position: 'absolute', left: 2, top: 2, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#299cf5' }, registeredText: { color: '#fff', fontSize: 12, fontWeight: '900' }, name: { minHeight: 34, color: '#fff', fontSize: 11.5, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, dex: { color: '#89979e', fontSize: 9.5, fontWeight: '700' }, pressed: { opacity: 0.72 },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20 }, loadingText: { color: '#aab8bf', fontWeight: '700' }, error: { gap: 7, borderWidth: 1, borderColor: '#df5770', borderRadius: 12, padding: 13, backgroundColor: '#39151e' }, errorTitle: { color: '#ffd8df', fontSize: 15, fontWeight: '900' }, errorText: { color: '#ffb8c4', fontSize: 12 }, retry: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#df5770' }, retryText: { color: '#fff', fontWeight: '900' }, empty: { alignItems: 'center', gap: 5, padding: 40 }, emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, emptyText: { color: '#9aa8af', textAlign: 'center' },
});
