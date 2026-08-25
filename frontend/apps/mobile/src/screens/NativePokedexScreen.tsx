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

const REGIONS = [
  [1, 'Kanto'], [2, 'Johto'], [3, 'Hoenn'], [4, 'Sinnoh'], [5, 'Unova'],
  [6, 'Kalos'], [7, 'Alola'], [8, 'Galar'], [9, 'Paldea'],
] as const;
const CATEGORIES: [NativePokedexCategory, string][] = [
  ['all', 'Pokémon'], ['shiny', 'Shiny'], ['shadow', 'Shadow'],
  ['costume', 'Costume'], ['mega', 'Mega & Forms'], ['max', 'Max'],
];
const absoluteUri = (base: string, value: string | null): string | null => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

export const NativePokedexScreen = ({
  assetBaseUrl,
  entries,
  error = null,
  isLoading = false,
  onBack,
  onOpenEntry,
  onRetry,
}: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 5 : width >= 520 ? 4 : 3;
  const [generation, setGeneration] = useState<number | null>(null);
  const [category, setCategory] = useState<NativePokedexCategory>('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterNativePokedexEntries({ category, entries, generation, query }), [category, entries, generation, query]);
  const registeredCount = useMemo(() => new Set(entries.filter(({ registered }) => registered).map(({ pokemonId }) => pokemonId)).size, [entries]);
  const totalSpecies = useMemo(() => new Set(entries.map(({ pokemonId }) => pokemonId)).size, [entries]);

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-pokedex-screen">
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
        data={filtered}
        key={columns}
        keyExtractor={(entry) => entry.id}
        numColumns={columns}
        ListHeaderComponent={(
          <View>
            <View style={styles.topbar}>
              <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}><Text style={[styles.backText, light && styles.textLight]}>‹</Text></Pressable>
              <View style={styles.headerCopy}><Text style={styles.eyebrow}>COMPLETE COLLECTION REFERENCE</Text><Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Pokédex</Text></View>
              <View style={[styles.progress, light && styles.progressLight]}><Text style={styles.progressValue}>{registeredCount}</Text><Text style={[styles.progressLabel, light && styles.mutedLight]}>of {totalSpecies}</Text></View>
            </View>
            <Text style={[styles.lead, light && styles.mutedLight]}>Explore every released species and variant, then compare it with your registered collection.</Text>
            <TextInput accessibilityLabel="Search Pokédex" autoCapitalize="none" onChangeText={setQuery} placeholder="Search Pokémon or Pokédex number" placeholderTextColor="#75838c" style={[styles.search, light && styles.searchLight]} value={query} />

            <Text style={[styles.railLabel, light && styles.textLight]}>Region</Text>
            <ScrollView contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false}>
              <Pressable onPress={() => setGeneration(null)} style={[styles.chip, light && styles.chipLight, generation == null && styles.chipActive]}><Text style={[styles.chipText, generation == null && styles.chipTextActive]}>All regions</Text></Pressable>
              {REGIONS.map(([id, label]) => {
                const selected = generation === id;
                const species = new Set(entries.filter((entry) => entry.generation === id).map((entry) => entry.pokemonId)).size;
                const registered = new Set(entries.filter((entry) => entry.generation === id && entry.registered).map((entry) => entry.pokemonId)).size;
                return <Pressable key={id} onPress={() => setGeneration(id)} style={[styles.regionChip, light && styles.chipLight, selected && styles.chipActive]}><Text style={[styles.regionTitle, light && styles.textLight, selected && styles.chipTextActive]}>{label}</Text><Text style={[styles.regionCount, light && styles.mutedLight, selected && styles.chipTextActive]}>{registered}/{species}</Text></Pressable>;
              })}
            </ScrollView>

            <Text style={[styles.railLabel, light && styles.textLight]}>Collection</Text>
            <ScrollView contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map(([value, label]) => <Pressable key={value} onPress={() => setCategory(value)} style={[styles.chip, light && styles.chipLight, category === value && styles.chipActive]}><Text style={[styles.chipText, light && styles.textLight, category === value && styles.chipTextActive]}>{label}</Text></Pressable>)}
            </ScrollView>
            <View style={styles.resultsHeading}><Text style={[styles.resultsTitle, light && styles.textLight]}>{filtered.length.toLocaleString()} entries</Text><Text style={[styles.resultsDetail, light && styles.mutedLight]}>Tap a Pokémon for its exact variant.</Text></View>
            {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorTitle}>Pokédex unavailable</Text><Text style={styles.errorText}>{error}</Text><Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
            {isLoading ? <View style={styles.loading}><ActivityIndicator color="#299cf5" /><Text style={[styles.loadingText, light && styles.mutedLight]}>Opening Pokédex…</Text></View> : null}
          </View>
        )}
        ListEmptyComponent={!isLoading && !error ? <View style={styles.empty}><Text style={[styles.emptyTitle, light && styles.textLight]}>No Pokémon match</Text><Text style={[styles.emptyText, light && styles.mutedLight]}>Try another region, category, or search term.</Text></View> : null}
        renderItem={({ item }) => (
          <View style={[styles.cardCell, { width: `${100 / columns}%` }]}>
            <Pressable accessibilityLabel={`Open ${item.name}`} accessibilityRole="button" onPress={() => onOpenEntry(item)} style={({ pressed }) => [styles.card, light && styles.cardLight, item.registered && styles.cardRegistered, pressed && styles.pressed]}>
              <View style={styles.imageStage}>
                {item.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, item.imageUri) ?? undefined }} style={styles.image} /> : null}
                {item.maxKind ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, `/images/${item.maxKind}.png`) ?? undefined }} style={styles.maxIcon} /> : null}
                {item.registered ? <View style={styles.registered}><Text style={styles.registeredText}>✓</Text></View> : null}
              </View>
              <Text numberOfLines={2} style={[styles.name, light && styles.textLight]}>{item.name}</Text>
              <Text style={[styles.dex, light && styles.mutedLight]}>#{String(item.pokedexNumber).padStart(4, '0')}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' }, textLight: { color: '#14232a' }, mutedLight: { color: '#5c6c74' },
  topbar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515b', borderRadius: 22, backgroundColor: '#171d22' }, backLight: { borderColor: '#becbd2', backgroundColor: '#fff' }, backText: { marginTop: -4, color: '#fff', fontSize: 38 }, headerCopy: { flex: 1 }, eyebrow: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#fff', fontSize: 30, fontWeight: '900' }, progress: { minWidth: 62, alignItems: 'center', borderWidth: 1, borderColor: '#304755', borderRadius: 12, padding: 8, backgroundColor: '#141d24' }, progressLight: { borderColor: '#c0ced6', backgroundColor: '#fff' }, progressValue: { color: '#299cf5', fontSize: 18, fontWeight: '900' }, progressLabel: { color: '#9caab1', fontSize: 9 }, lead: { marginTop: 4, color: '#afbbc2', fontSize: 13, lineHeight: 18 },
  search: { minHeight: 48, marginTop: 14, borderWidth: 1, borderColor: '#46545d', borderRadius: 12, paddingHorizontal: 14, color: '#fff', backgroundColor: '#161c21', fontSize: 15 }, searchLight: { borderColor: '#b8c6cd', color: '#14232a', backgroundColor: '#fff' }, railLabel: { marginTop: 15, marginBottom: 7, color: '#fff', fontSize: 12, fontWeight: '900' }, railContent: { gap: 7, paddingRight: 12 }, chip: { minHeight: 41, justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 999, paddingHorizontal: 15, backgroundColor: '#161c21' }, chipLight: { borderColor: '#bec9cf', backgroundColor: '#fff' }, chipActive: { borderColor: '#299cf5', backgroundColor: '#123c61' }, chipText: { color: '#bdc7cc', fontSize: 11, fontWeight: '900' }, chipTextActive: { color: '#fff' }, regionChip: { minWidth: 76, minHeight: 50, justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#161c21' }, regionTitle: { color: '#fff', fontSize: 12, fontWeight: '900' }, regionCount: { marginTop: 2, color: '#93a1a8', fontSize: 9 },
  resultsHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 18, marginBottom: 7 }, resultsTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, resultsDetail: { color: '#89989f', fontSize: 10 },
  cardCell: { padding: 4 }, card: { minHeight: 158, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#324149', borderRadius: 12, padding: 7, backgroundColor: '#151b20' }, cardLight: { borderColor: '#c2cdd3', backgroundColor: '#fff' }, cardRegistered: { borderColor: '#299cf5' }, imageStage: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, image: { width: '86%', height: '86%' }, maxIcon: { position: 'absolute', top: '5%', right: '5%', width: '23%', height: '23%' }, registered: { position: 'absolute', left: 2, top: 2, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#299cf5' }, registeredText: { color: '#fff', fontSize: 12, fontWeight: '900' }, name: { minHeight: 34, color: '#fff', fontSize: 11.5, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, dex: { color: '#89979e', fontSize: 9.5, fontWeight: '700' }, pressed: { opacity: 0.72 },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20 }, loadingText: { color: '#aab8bf', fontWeight: '700' }, error: { gap: 7, borderWidth: 1, borderColor: '#df5770', borderRadius: 12, padding: 13, backgroundColor: '#39151e' }, errorTitle: { color: '#ffd8df', fontSize: 15, fontWeight: '900' }, errorText: { color: '#ffb8c4', fontSize: 12 }, retry: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#df5770' }, retryText: { color: '#fff', fontWeight: '900' }, empty: { alignItems: 'center', gap: 5, padding: 40 }, emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, emptyText: { color: '#9aa8af', textAlign: 'center' },
});
