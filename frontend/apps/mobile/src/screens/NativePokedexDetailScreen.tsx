import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildNativePokedexRegistrationId,
  type NativePokedexEntry,
  type NativePokedexManualRegistration,
  type NativePokedexRegistrationFacets,
} from '../features/tools/nativePokedexModel';

type DetailTab = 'registered' | 'info' | 'battle' | 'more';

type Props = {
  allEntries: NativePokedexEntry[];
  assetBaseUrl: string;
  entry: NativePokedexEntry | null;
  error?: string | null;
  isSaving?: boolean;
  onBack: () => void;
  onManage: (entry: NativePokedexEntry) => void;
  onOpenEntry: (entry: NativePokedexEntry) => void;
  onToggleRegistration: (registration: NativePokedexManualRegistration, registered: boolean) => void;
  pokemon: BasePokemon | null;
  signedIn: boolean;
};

const TABS: [DetailTab, string][] = [
  ['registered', 'Registered'],
  ['info', 'Info'],
  ['battle', 'Battle'],
  ['more', 'More'],
];

const SECTION_ORDER = [
  ['primary', 'Registered'],
  ['costume', 'Costumes'],
  ['shadow', 'Shadow'],
  ['mega', 'Mega forms'],
  ['max', 'Max forms'],
  ['fusion', 'Fusion forms'],
] as const;

const QUALITY_OPTIONS: { facets: NativePokedexRegistrationFacets; icon: string; label: string; tintOnLight?: boolean }[] = [
  { label: 'Lucky', icon: '/images/lucky-icon.png', facets: { lucky: true }, tintOnLight: true },
  { label: 'Purified', icon: '/images/purified.png', facets: { purified: true } },
  { label: 'XXS', icon: '/images/xxs.png', facets: { size: 'xxs' }, tintOnLight: true },
  { label: 'XS', icon: '/images/height.png', facets: { size: 'xs' }, tintOnLight: true },
  { label: 'XL', icon: '/images/height.png', facets: { size: 'xl' }, tintOnLight: true },
  { label: 'XXL', icon: '/images/xxl.png', facets: { size: 'xxl' }, tintOnLight: true },
  { label: 'Male', icon: '/images/male-icon.png', facets: { gender: 'Male' } },
  { label: 'Female', icon: '/images/female-icon.png', facets: { gender: 'Female' } },
  { label: '100%', icon: '/images/appraisal_04.png', facets: { appraisal: '4-star' } },
];

const absoluteUri = (base: string, value: string | null): string | null => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

const sectionFor = (entry: NativePokedexEntry): string => {
  if (entry.category.includes('costume')) return 'costume';
  if (entry.category.includes('shadow')) return 'shadow';
  if (entry.category.includes('mega')) return 'mega';
  if (entry.category.includes('dynamax') || entry.category.includes('gigantamax')) return 'max';
  if (entry.category.includes('fusion')) return 'fusion';
  return 'primary';
};

const toRegistration = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets = {},
): NativePokedexManualRegistration => ({
  entryId: entry.id,
  facets,
  registrationId: buildNativePokedexRegistrationId(entry.id, facets),
});

const facetRegistered = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets,
): boolean => entry.manualRegistrationIds.includes(buildNativePokedexRegistrationId(entry.id, facets))
  || entry.registeredFacets.some((candidate) => Object.entries(facets).every(([key, value]) => candidate[key as keyof NativePokedexRegistrationFacets] === value));

const facetRegistrationState = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets,
): { lockedByInstance: boolean; manual: boolean; registered: boolean } => {
  const registrationId = buildNativePokedexRegistrationId(entry.id, facets);
  const manual = entry.manualRegistrationIds.includes(registrationId);
  const registered = facetRegistered(entry, facets);
  return { lockedByInstance: registered && !manual, manual, registered };
};

const formatValue = (value: number | null | undefined, digits = 2): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
};

const MoveRow = ({ assetBaseUrl, light, move }: { assetBaseUrl: string; light: boolean; move: Move }) => (
  <View style={[styles.moveRow, light && styles.softLight]}>
    <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/types/${move.type_name?.toLocaleLowerCase()}.png`) ?? undefined }} style={styles.moveType} />
    <View style={styles.moveCopy}><Text style={[styles.moveName, light && styles.textLight]}>{move.name}{move.legacy ? '*' : ''}</Text><Text style={[styles.moveMeta, light && styles.mutedLight]}>{move.type_name} · {move.is_fast ? 'Fast' : 'Charged'}</Text></View>
    <View style={styles.moveNumbers}><Text style={[styles.movePower, light && styles.textLight]}>{move.pvp_power || move.raid_power || '—'}</Text><Text style={[styles.moveMeta, light && styles.mutedLight]}>power</Text></View>
  </View>
);

export const NativePokedexDetailScreen = ({ allEntries, assetBaseUrl, entry, error = null, isSaving = false, onBack, onManage, onOpenEntry, onToggleRegistration, pokemon, signedIn }: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<DetailTab>('registered');
  const speciesEntries = useMemo(() => entry ? allEntries.filter(({ pokemonId }) => pokemonId === entry.pokemonId) : [], [allEntries, entry]);
  if (!entry || !pokemon) {
    return <View style={[styles.centered, light && styles.rootLight]}><Text style={[styles.title, light && styles.textLight]}>Pokémon unavailable</Text><Pressable accessibilityRole="button" onPress={onBack} style={styles.primary}><Text style={styles.primaryText}>Back to Pokédex</Text></Pressable></View>;
  }
  const stats = [['Attack', pokemon.attack], ['Defense', pokemon.defense], ['Stamina', pokemon.stamina], ['CP 40', pokemon.cp40], ['CP 50', pokemon.cp50]] as const;
  const fastMoves = (pokemon.moves ?? []).filter(({ is_fast }) => Boolean(is_fast));
  const chargedMoves = (pokemon.moves ?? []).filter(({ is_fast }) => !is_fast);
  const evolutionIds = new Set([...(pokemon.evolves_from ?? []), ...(pokemon.evolves_to ?? []), ...(pokemon.evolutionData?.evolves_from ?? []), ...(pokemon.evolutionData?.evolves_to ?? [])]);
  const evolutionEntries = allEntries.filter((candidate) => candidate.category === 'pokemon' && evolutionIds.has(candidate.pokemonId));
  const groupedEntries = SECTION_ORDER.map(([key, label]) => ({ key, label, entries: speciesEntries.filter((candidate) => sectionFor(candidate) === key) })).filter((section) => section.entries.length > 0);
  const size = pokemon.sizes;
  const shadow = entry.category.includes('shadow');

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-pokedex-detail-screen">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Back to Pokédex" onPress={onBack} style={[styles.back, light && styles.backLight]}><Text style={[styles.backText, light && styles.textLight]}>‹</Text></Pressable><Text style={[styles.topTitle, light && styles.textLight]}>Pokédex entry</Text><View style={styles.backPlaceholder} /></View>
        <View style={[styles.hero, light && styles.cardLight]}>
          <View style={styles.heroTop}><Text style={styles.dex}>#{String(entry.pokedexNumber).padStart(4, '0')}</Text><View style={[styles.registrationSummary, entry.registered && styles.registrationSummaryActive]}><Text style={[styles.registrationSummaryText, entry.registered && styles.registrationSummaryTextActive]}>{entry.registered ? '✓ Registered' : 'Missing'}</Text></View></View>
          <View style={styles.imageStage}>{entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUri) ?? undefined }} style={styles.image} /> : null}{entry.maxKind ? <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${entry.maxKind}.png`) ?? undefined }} style={styles.maxIcon} /> : null}</View>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>{entry.name}</Text>
          <Text style={[styles.meta, light && styles.mutedLight]}>Generation {pokemon.generation} · {pokemon.rarity || 'Pokémon'}</Text>
          <View style={styles.types}>{entry.typeIconUris.map((uri) => <Image key={uri} source={{ uri: absoluteUri(assetBaseUrl, uri) ?? undefined }} style={styles.type} />)}</View>
        </View>

        <View accessibilityRole="tablist" style={[styles.tabs, light && styles.cardLight]}>{TABS.map(([value, label]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === value }} key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}><Text style={[styles.tabText, light && styles.textLight, tab === value && styles.tabTextActive]}>{label}</Text>{value === 'registered' ? <Text style={[styles.tabCount, tab === value && styles.tabCountActive]}>{speciesEntries.filter(({ registered }) => registered).length}</Text> : null}</Pressable>)}</View>

        {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        {isSaving ? <View style={styles.saving}><ActivityIndicator color="#299cf5" /><Text style={[styles.savingText, light && styles.mutedLight]}>Updating Pokédex…</Text></View> : null}

        {tab === 'registered' ? <View style={styles.tabPanel}>
          <View style={[styles.sectionHeading, light && styles.cardLight]}><View><Text style={styles.eyebrow}>COLLECTIBLE FORMS</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Registration checklist</Text><Text style={[styles.body, light && styles.mutedLight]}>Caught Pokémon count automatically. Mark other entries manually without changing your collection.</Text></View><Pressable accessibilityRole="button" onPress={() => onManage(entry)} style={styles.manage}><Text style={styles.manageText}>{signedIn ? 'Add or manage' : 'Sign in to add'} →</Text></Pressable></View>
          {groupedEntries.map((section) => <View key={section.key} style={[styles.cardSection, light && styles.cardLight]}><View style={styles.cardSectionHeading}><Text style={[styles.cardSectionTitle, light && styles.textLight]}>{section.label}</Text><Text style={[styles.cardSectionCount, light && styles.mutedLight]}>{section.entries.filter(({ registered }) => registered).length} / {section.entries.length}</Text></View><View style={styles.variantGrid}>{section.entries.map((candidate) => { const registration = toRegistration(candidate); const lockedByInstance = candidate.instanceRegistered; return <View key={candidate.id} style={[styles.variantCard, light && styles.softLight, candidate.registered && styles.variantCardRegistered]}><Pressable accessibilityRole="button" accessibilityLabel={`View ${candidate.name}`} onPress={() => onOpenEntry(candidate)} style={styles.variantOpen}><View style={styles.variantStage}>{candidate.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, candidate.imageUri) ?? undefined }} style={styles.variantImage} /> : null}{candidate.maxKind ? <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${candidate.maxKind}.png`) ?? undefined }} style={styles.variantMax} /> : null}</View><Text numberOfLines={2} style={[styles.variantName, light && styles.textLight]}>{candidate.name}</Text><Text style={[styles.variantState, candidate.registered && styles.variantStateRegistered]}>{lockedByInstance ? 'In collection' : candidate.registered ? 'Registered' : 'Missing'}</Text></Pressable><Pressable accessibilityLabel={`${candidate.registered ? 'Unregister' : 'Register'} ${candidate.name}`} accessibilityRole="button" disabled={!signedIn || lockedByInstance || isSaving} onPress={() => onToggleRegistration(registration, !candidate.registered)} style={[styles.registrationToggle, candidate.registered && styles.registrationToggleActive, (!signedIn || lockedByInstance) && styles.registrationToggleDisabled]}><Text style={styles.registrationToggleText}>{lockedByInstance ? '✓' : candidate.registered ? '−' : '+'}</Text></Pressable></View>; })}</View></View>)}
        </View> : null}

        {tab === 'info' ? <View style={styles.tabPanel}>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>BASE STATS</Text><View style={styles.stats}>{stats.map(([label, value]) => <View key={label} style={[styles.stat, light && styles.softLight]}><Text style={styles.statValue}>{formatValue(value, 0)}</Text><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text></View>)}</View></View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>AVAILABILITY</Text><Text style={[styles.body, light && styles.mutedLight]}>Released {pokemon.date_available || 'date unavailable'}</Text><Text style={[styles.body, light && styles.mutedLight]}>Shiny {pokemon.shiny_available ? `available since ${pokemon.date_shiny_available || 'release'}` : 'not available'}</Text><Text style={[styles.body, light && styles.mutedLight]}>{pokemon.costumes?.length ?? 0} costumes · {pokemon.megaEvolutions?.length ?? 0} Mega forms · {pokemon.max?.length ?? 0} Max forms</Text></View>
          {size ? <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>SIZE RANGES</Text><View style={styles.sizeGrid}><View style={[styles.sizeCard, light && styles.softLight]}><Image source={{ uri: absoluteUri(assetBaseUrl, '/images/height.png') ?? undefined }} style={[styles.sizeIcon, light && styles.darkIconLight]} /><Text style={[styles.sizeTitle, light && styles.textLight]}>Height</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>Base {formatValue(size.pokedex_height)} m</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>XXS ≤ {formatValue(size.height_xxs_threshold)} · XXL ≥ {formatValue(size.height_xxl_threshold)}</Text></View><View style={[styles.sizeCard, light && styles.softLight]}><Image source={{ uri: absoluteUri(assetBaseUrl, '/images/weight.png') ?? undefined }} style={[styles.sizeIcon, light && styles.darkIconLight]} /><Text style={[styles.sizeTitle, light && styles.textLight]}>Weight</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>Base {formatValue(size.pokedex_weight)} kg</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>XXS ≤ {formatValue(size.weight_xxs_threshold)} · XXL ≥ {formatValue(size.weight_xxl_threshold)}</Text></View></View></View> : null}
          {evolutionEntries.length > 0 ? <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>EVOLUTION</Text><View style={styles.evolutionRail}>{evolutionEntries.map((candidate) => <Pressable accessibilityRole="button" key={candidate.id} onPress={() => onOpenEntry(candidate)} style={[styles.evolutionCard, light && styles.softLight]}>{candidate.imageUri ? <Image source={{ uri: absoluteUri(assetBaseUrl, candidate.imageUri) ?? undefined }} style={styles.evolutionImage} /> : null}<Text style={[styles.evolutionName, light && styles.textLight]}>{candidate.name}</Text></Pressable>)}</View></View> : null}
        </View> : null}

        {tab === 'battle' ? <View style={styles.tabPanel}>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>BATTLE PROFILE</Text><View style={styles.stats}>{stats.slice(0, 3).map(([label, value]) => <View key={label} style={[styles.stat, light && styles.softLight]}><Text style={styles.statValue}>{formatValue(value, 0)}</Text><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text></View>)}</View></View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={[styles.cardSectionTitle, light && styles.textLight]}>Fast moves</Text>{fastMoves.length > 0 ? fastMoves.map((move) => <MoveRow assetBaseUrl={assetBaseUrl} key={move.move_id} light={light} move={move} />) : <Text style={[styles.body, light && styles.mutedLight]}>No fast moves are listed.</Text>}</View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={[styles.cardSectionTitle, light && styles.textLight]}>Charged moves</Text>{chargedMoves.length > 0 ? chargedMoves.map((move) => <MoveRow assetBaseUrl={assetBaseUrl} key={move.move_id} light={light} move={move} />) : <Text style={[styles.body, light && styles.mutedLight]}>No charged moves are listed.</Text>}</View>
        </View> : null}

        {tab === 'more' ? <View style={styles.tabPanel}>
          <View style={[styles.sectionHeading, light && styles.cardLight]}><Text style={styles.eyebrow}>EXACT COMBINATIONS</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Quality registrations</Text><Text style={[styles.body, light && styles.mutedLight]}>Track Lucky, size, gender, Purified, and perfect entries separately from the base form.</Text></View>
          <View style={[styles.qualityGrid, light && styles.cardLight]}>{QUALITY_OPTIONS.map((option) => {
            const unavailable = shadow && Boolean(option.facets.lucky || option.facets.purified);
            const { lockedByInstance, registered } = facetRegistrationState(entry, option.facets);
            const disabled = unavailable || lockedByInstance;
            const registration = toRegistration(entry, option.facets);
            return <Pressable accessibilityRole="button" accessibilityState={{ checked: registered, disabled }} key={option.label} disabled={!signedIn || disabled || isSaving} onPress={() => onToggleRegistration(registration, !registered)} style={[styles.qualityCard, light && styles.softLight, registered && styles.qualityCardRegistered, disabled && styles.registrationToggleDisabled]}><Image source={{ uri: absoluteUri(assetBaseUrl, option.icon) ?? undefined }} style={[styles.qualityIcon, light && option.tintOnLight && styles.darkIconLight]} /><Text style={[styles.qualityLabel, light && styles.textLight]}>{option.label}</Text><Text style={[styles.qualityState, registered && styles.variantStateRegistered]}>{unavailable ? 'Unavailable' : lockedByInstance ? 'In collection' : registered ? 'Registered' : 'Missing'}</Text></Pressable>;
          })}</View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>SPECIES SUMMARY</Text><Text style={[styles.body, light && styles.mutedLight]}>{speciesEntries.length} released collectible entries · {speciesEntries.filter(({ registered }) => registered).length} registered</Text><Text style={[styles.body, light && styles.mutedLight]}>{pokemon.moves?.length ?? 0} known moves · {pokemon.costumes?.length ?? 0} costumes · {pokemon.megaEvolutions?.length ?? 0} Mega forms</Text></View>
        </View> : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' }, content: { gap: 12, paddingHorizontal: 12 }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, backgroundColor: '#090d12' }, textLight: { color: '#14232a' }, mutedLight: { color: '#586b74' }, cardLight: { borderColor: '#c2cdd3', backgroundColor: '#fff' }, softLight: { backgroundColor: '#eef4f7' },
  topbar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 22, backgroundColor: '#171d22' }, backLight: { borderColor: '#c1ccd2', backgroundColor: '#fff' }, backText: { marginTop: -4, color: '#fff', fontSize: 38 }, backPlaceholder: { width: 44, height: 44 }, topTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  hero: { alignItems: 'center', borderWidth: 1, borderColor: '#34424a', borderRadius: 18, padding: 14, backgroundColor: '#171d21' }, heroTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dex: { color: '#299cf5', fontSize: 12, fontWeight: '900' }, registrationSummary: { borderWidth: 1, borderColor: '#59666d', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, registrationSummaryActive: { borderColor: '#299cf5', backgroundColor: '#123c61' }, registrationSummaryText: { color: '#aeb8bd', fontSize: 9, fontWeight: '900' }, registrationSummaryTextActive: { color: '#fff' }, imageStage: { width: '64%', maxWidth: 300, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, image: { width: '94%', height: '94%' }, maxIcon: { position: 'absolute', right: '8%', top: '8%', width: '22%', height: '22%', resizeMode: 'contain' }, title: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center' }, meta: { marginTop: 4, color: '#9ca9b0', fontSize: 12 }, types: { flexDirection: 'row', gap: 8, marginTop: 9 }, type: { width: 28, height: 28 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: '#34424a', borderRadius: 14, padding: 4, backgroundColor: '#141a1f' }, tab: { minHeight: 43, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 4 }, tabActive: { backgroundColor: '#176aa9' }, tabText: { color: '#aeb9bf', fontSize: 10.5, fontWeight: '900' }, tabTextActive: { color: '#fff' }, tabCount: { minWidth: 18, height: 18, textAlign: 'center', textAlignVertical: 'center', borderRadius: 9, color: '#aeb9bf', backgroundColor: '#273038', fontSize: 8, fontWeight: '900' }, tabCountActive: { color: '#176aa9', backgroundColor: '#fff' }, tabPanel: { gap: 10 },
  sectionHeading: { gap: 6, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 14, backgroundColor: '#171d21' }, sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, eyebrow: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, body: { color: '#b2bec5', fontSize: 12, lineHeight: 18 }, manage: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 13, backgroundColor: '#168ced' }, manageText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  cardSection: { gap: 9, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 12, backgroundColor: '#171d21' }, cardSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900' }, cardSectionCount: { color: '#9ba7ad', fontSize: 10, fontWeight: '800' }, variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, variantCard: { width: '48%', minHeight: 180, overflow: 'hidden', borderWidth: 1, borderColor: '#3b4850', borderRadius: 12, backgroundColor: '#10161a' }, variantCardRegistered: { borderColor: '#299cf5' }, variantOpen: { flex: 1, alignItems: 'center', padding: 8 }, variantStage: { width: '100%', height: 105, alignItems: 'center', justifyContent: 'center' }, variantImage: { width: '88%', height: '88%' }, variantMax: { position: 'absolute', right: 2, top: 2, width: 29, height: 29, resizeMode: 'contain' }, variantName: { minHeight: 34, color: '#fff', fontSize: 11, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, variantState: { color: '#8e9ca3', fontSize: 8.5, fontWeight: '800' }, variantStateRegistered: { color: '#299cf5' }, registrationToggle: { position: 'absolute', right: 6, top: 6, width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#168ced' }, registrationToggleActive: { backgroundColor: '#b8445a' }, registrationToggleDisabled: { opacity: 0.42 }, registrationToggleText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, stat: { minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10, padding: 10, backgroundColor: '#11171b' }, statValue: { color: '#299cf5', fontSize: 18, fontWeight: '900' }, statLabel: { color: '#94a2aa', fontSize: 10, fontWeight: '800' }, sizeGrid: { gap: 8 }, sizeCard: { gap: 4, borderRadius: 11, padding: 11, backgroundColor: '#11171b' }, sizeIcon: { width: 30, height: 30, resizeMode: 'contain' }, sizeTitle: { color: '#fff', fontSize: 14, fontWeight: '900' }, sizeValue: { color: '#9eabb2', fontSize: 10.5 }, evolutionRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, evolutionCard: { width: 104, alignItems: 'center', borderRadius: 11, padding: 8, backgroundColor: '#11171b' }, evolutionImage: { width: 82, height: 82, resizeMode: 'contain' }, evolutionName: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  moveRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 10, padding: 9, backgroundColor: '#11171b' }, moveType: { width: 30, height: 30 }, moveCopy: { minWidth: 0, flex: 1 }, moveName: { color: '#fff', fontSize: 12, fontWeight: '900' }, moveMeta: { color: '#8e9ba2', fontSize: 8.5 }, moveNumbers: { alignItems: 'flex-end' }, movePower: { color: '#fff', fontSize: 14, fontWeight: '900' },
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 10, backgroundColor: '#171d21' }, qualityCard: { width: '31%', minHeight: 104, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#3b4850', borderRadius: 11, padding: 7, backgroundColor: '#11171b' }, qualityCardRegistered: { borderColor: '#299cf5', backgroundColor: '#12314a' }, qualityIcon: { width: 35, height: 35, resizeMode: 'contain' }, darkIconLight: { tintColor: '#26363e' }, qualityLabel: { color: '#fff', fontSize: 10.5, fontWeight: '900' }, qualityState: { color: '#8e9ca3', fontSize: 7.5, fontWeight: '800' },
  primary: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 18, backgroundColor: '#168ced' }, primaryText: { color: '#fff', fontWeight: '900' }, saving: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: 10, backgroundColor: '#152a39' }, savingText: { color: '#aebac0', fontSize: 10, fontWeight: '800' }, error: { borderWidth: 1, borderColor: '#df5770', borderRadius: 10, padding: 10, backgroundColor: '#39151e' }, errorText: { color: '#ffc2cc', fontSize: 11, fontWeight: '800' },
});
