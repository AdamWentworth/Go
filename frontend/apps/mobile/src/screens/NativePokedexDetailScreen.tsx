import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeBackIcon } from '../components/NativeBackIcon';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildNativePokedexCombinationSections,
  buildNativePokedexRegistrationSlots,
  filterNativePokedexCombinations,
  toggleNativePokedexComboFilter,
  type NativePokedexComboFilter,
  type NativePokedexCombination,
  type NativePokedexDetailSectionKey,
  type NativePokedexRegistrationSlot,
} from '../features/tools/nativePokedexDetailModel';
import type {
  NativePokedexEntry,
  NativePokedexManualRegistration,
} from '../features/tools/nativePokedexModel';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

type DetailTab = 'registered' | 'info' | 'battle' | 'more';

type Props = {
  allEntries: NativePokedexEntry[];
  assetBaseUrl: string;
  entry: NativePokedexEntry | null;
  error?: string | null;
  isSaving?: boolean;
  onBack: () => void;
  onOpenEntry: (entry: NativePokedexEntry) => void;
  onSetRegistrations: (registrations: NativePokedexManualRegistration[], registered: boolean) => void;
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

const SECTION_ORDER: [NativePokedexDetailSectionKey, string][] = [
  ['registered', 'Registered'],
  ['costume', 'Costumes'],
  ['shadow', 'Shadow'],
  ['mega', 'Mega forms'],
  ['max', 'Max forms'],
  ['fusion', 'Fusion forms'],
  ['special', 'Other forms'],
];

const COMBO_FILTERS: { key: NativePokedexComboFilter; label: string }[] = [
  { key: 'registered', label: 'Registered' }, { key: 'missing', label: 'Missing' },
  { key: 'pokemon', label: 'Pokémon' }, { key: 'shiny', label: 'Shiny' },
  { key: 'male', label: 'Male' }, { key: 'female', label: 'Female' },
  { key: 'xxs', label: 'XXS' }, { key: 'xs', label: 'XS' },
  { key: 'xl', label: 'XL' }, { key: 'xxl', label: 'XXL' },
  { key: 'lucky', label: 'Lucky' }, { key: 'perfect', label: '100%' },
];

const DARK_ON_LIGHT = new Set([
  '/images/appraisal_04.png', '/images/height.png', '/images/lucky-icon.png',
  '/images/weight.png', '/images/xxl.png', '/images/xxs.png',
]);

const THEME_COLORS: Record<string, [string, string]> = {
  pokemon: ['#168fc4', '#42cdbf'], shiny: ['#e8941d', '#f3ca43'], shadow: ['#5c2a91', '#a45ae5'],
  costume: ['#d95075', '#5eb9df'], mega: ['#9f41bd', '#e66ab7'], dynamax: ['#c43e65', '#ef8198'],
  gigantamax: ['#bd303d', '#ef684d'], fusion: ['#365ec0', '#55bfe7'],
};

const categoryTheme = (entry: NativePokedexEntry): [string, string] => {
  const category = entry.category;
  const base = category.includes('gigantamax') ? 'gigantamax'
    : category.includes('dynamax') ? 'dynamax'
      : category.includes('fusion') ? 'fusion'
        : category.includes('mega') ? 'mega'
          : category.includes('costume') ? 'costume'
            : category.includes('shadow') ? 'shadow'
              : category.includes('shiny') ? 'shiny' : 'pokemon';
  return THEME_COLORS[base] ?? THEME_COLORS.pokemon;
};

const absoluteUri = (base: string, value: string | null): string | null => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

const formatValue = (value: number | null | undefined, digits = 2): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
};

const genderOptions = (pokemon: BasePokemon): ('Male' | 'Female')[] => {
  const rate = String(pokemon.gender_rate ?? '').toLocaleUpperCase();
  if (rate === 'GENDERLESS' || rate === 'NONE') return [];
  if (rate === 'M/M') return ['Male'];
  if (rate === 'F/F') return ['Female'];
  return ['Male', 'Female'];
};

const facetBadges = (combo: NativePokedexCombination): { icon: string; label: string }[] => [
  combo.facets.gender ? { label: combo.facets.gender, icon: `/images/${combo.facets.gender.toLocaleLowerCase()}-icon.png` } : null,
  combo.facets.size ? { label: combo.facets.size.toLocaleUpperCase(), icon: combo.facets.size === 'xxs' ? '/images/xxs.png' : combo.facets.size === 'xxl' ? '/images/xxl.png' : '/images/height.png' } : null,
  combo.facets.lucky ? { label: 'Lucky', icon: '/images/lucky-icon.png' } : null,
  combo.facets.appraisal ? { label: '100%', icon: '/images/appraisal_04.png' } : null,
].filter((badge): badge is { icon: string; label: string } => Boolean(badge));

const HeroBackdrop = ({ colors, light }: { colors: [string, string]; light: boolean }) => (
  <Svg height="100%" pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" width="100%">
    <Defs><LinearGradient id="pokedex-detail-hero" x1="0%" x2="100%" y1="0%" y2="100%"><Stop offset="0" stopColor={colors[0]} stopOpacity={light ? 0.58 : 0.9} /><Stop offset="100%" stopColor={colors[1]} stopOpacity={light ? 0.42 : 0.72} /></LinearGradient></Defs>
    <Rect fill="url(#pokedex-detail-hero)" height="100" width="100" x="0" y="0" />
  </Svg>
);

const MoveRow = ({ assetBaseUrl, light, move }: { assetBaseUrl: string; light: boolean; move: Move }) => (
  <View style={[styles.moveRow, light && styles.softLight]}>
    <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/types/${move.type_name?.toLocaleLowerCase()}.png`) ?? undefined }} style={styles.moveType} />
    <View style={styles.moveCopy}><Text style={[styles.moveName, light && styles.textLight]}>{move.name}{move.legacy ? '*' : ''}</Text><Text style={[styles.moveMeta, light && styles.mutedLight]}>{move.type_name} · {move.is_fast ? 'Fast' : 'Charged'}</Text></View>
    <View style={styles.moveNumbers}><Text style={[styles.movePower, light && styles.textLight]}>{move.pvp_power || move.raid_power || '—'}</Text><Text style={[styles.moveMeta, light && styles.mutedLight]}>power</Text></View>
  </View>
);

const RegistrationCard = ({ assetBaseUrl, light, onOpen, onToggle, saving, signedIn, slot }: {
  assetBaseUrl: string; light: boolean; onOpen: () => void; onToggle: () => void;
  saving: boolean; signedIn: boolean; slot: NativePokedexRegistrationSlot;
}) => (
  <View style={[styles.variantCard, light && styles.softLight, slot.registered && styles.variantCardRegistered]}>
    <Pressable accessibilityLabel={`View ${slot.label}`} accessibilityRole="button" onPress={onOpen} style={styles.variantOpen}>
      <View style={styles.variantStage}>
        {slot.entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, slot.entry.imageUri) ?? undefined }} style={styles.variantImage} /> : null}
        {slot.icon ? <Image source={{ uri: absoluteUri(assetBaseUrl, slot.icon) ?? undefined }} style={[styles.variantIcon, light && DARK_ON_LIGHT.has(slot.icon) && styles.darkIconLight]} /> : null}
      </View>
      <Text numberOfLines={2} style={[styles.variantName, light && styles.textLight]}>{slot.label}</Text>
      <Text style={[styles.variantState, light && styles.variantStateLight, slot.registered && styles.variantStateRegistered, light && slot.registered && styles.variantStateRegisteredLight]}>{slot.lockedByInstance ? 'In collection' : slot.registered ? 'Registered' : 'Missing'}</Text>
    </Pressable>
    <Pressable accessibilityLabel={`${slot.registered ? 'Unregister' : 'Register'} ${slot.label}`} accessibilityRole="button" disabled={!signedIn || slot.lockedByInstance || saving} onPress={onToggle} style={[styles.registrationToggle, slot.registered && styles.registrationToggleActive, (!signedIn || slot.lockedByInstance) && styles.registrationToggleDisabled]}><Text style={styles.registrationToggleText}>{slot.lockedByInstance ? '✓' : slot.registered ? '−' : '+'}</Text></Pressable>
  </View>
);

const CombinationCard = ({ assetBaseUrl, combo, light, onToggle, saving, signedIn }: {
  assetBaseUrl: string; combo: NativePokedexCombination; light: boolean; onToggle: () => void;
  saving: boolean; signedIn: boolean;
}) => (
  <Pressable accessibilityLabel={`${combo.registered ? 'Unregister' : 'Register'} ${combo.label}`} accessibilityRole="button" accessibilityState={{ checked: combo.registered, disabled: combo.lockedByInstance }} disabled={!signedIn || combo.lockedByInstance || saving} onPress={onToggle} style={[styles.comboCard, light && styles.softLight, combo.registered && styles.comboCardRegistered, light && combo.registered && styles.comboCardRegisteredLight, combo.lockedByInstance && styles.registrationToggleDisabled]}>
    <View style={styles.comboStage}>
      {combo.entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, combo.entry.imageUri) ?? undefined }} style={styles.comboImage} /> : null}
      <View style={styles.comboBadges}>{facetBadges(combo).map((badge) => <Image accessibilityLabel={badge.label} key={`${combo.id}-${badge.label}`} source={{ uri: absoluteUri(assetBaseUrl, badge.icon) ?? undefined }} style={[styles.comboBadge, light && DARK_ON_LIGHT.has(badge.icon) && styles.darkIconLight]} />)}</View>
    </View>
    <Text numberOfLines={2} style={[styles.comboLabel, light && styles.textLight]}>{combo.label}</Text>
    <Text style={[styles.comboState, light && styles.variantStateLight, combo.registered && styles.variantStateRegistered, light && combo.registered && styles.variantStateRegisteredLight]}>{combo.lockedByInstance ? 'In collection' : combo.registered ? 'Registered' : 'Missing'}</Text>
  </Pressable>
);

export const NativePokedexDetailScreen = ({ allEntries, assetBaseUrl, entry, error = null, isSaving = false, onBack, onOpenEntry, onSetRegistrations, onToggleRegistration, pokemon, signedIn }: Props) => {
  const light = useNativeColorScheme() === 'light';
  const [tab, setTab] = useState<DetailTab>('registered');
  const [comboSectionId, setComboSectionId] = useState<string | null>(null);
  const [comboQuery, setComboQuery] = useState('');
  const [comboFilters, setComboFilters] = useState<NativePokedexComboFilter[]>([]);
  const slots = useMemo(() => entry ? buildNativePokedexRegistrationSlots(allEntries, entry.pokemonId) : [], [allEntries, entry]);
  const comboSections = useMemo(() => pokemon ? buildNativePokedexCombinationSections(allEntries, pokemon) : [], [allEntries, pokemon]);
  if (!entry || !pokemon) return <View style={[styles.centered, light && styles.rootLight]}><Text style={[styles.title, light && styles.textLight]}>Pokémon unavailable</Text><Pressable accessibilityRole="button" onPress={onBack} style={styles.primary}><Text style={styles.primaryText}>Back to Pokédex</Text></Pressable></View>;

  const groupedSlots = SECTION_ORDER.map(([key, label]) => ({ key, label, slots: slots.filter((slot) => slot.section === key) })).filter((section) => section.slots.length > 0);
  const activeComboSection = comboSections.find(({ id }) => id === comboSectionId) ?? comboSections[0];
  const filteredCombos = filterNativePokedexCombinations(activeComboSection?.combinations ?? [], comboQuery, comboFilters);
  const registerableSlots = slots.filter(({ registered }) => !registered).map(({ registration }) => registration);
  const removableSlots = slots.filter(({ registered, lockedByInstance }) => registered && !lockedByInstance).map(({ registration }) => registration);
  const registerableCombos = filteredCombos.filter(({ registered }) => !registered).map(({ registration }) => registration);
  const removableCombos = filteredCombos.filter(({ registered, lockedByInstance }) => registered && !lockedByInstance).map(({ registration }) => registration);
  const registeredCount = slots.filter(({ registered }) => registered).length;
  const stats = [['Attack', pokemon.attack], ['Defense', pokemon.defense], ['Stamina', pokemon.stamina], ['CP 40', pokemon.cp40], ['CP 50', pokemon.cp50]] as const;
  const fastMoves = (pokemon.moves ?? []).filter((move) => Boolean(move.is_fast));
  const chargedMoves = (pokemon.moves ?? []).filter((move) => !move.is_fast);
  const evolutionIds = new Set([...(pokemon.evolves_from ?? []), ...(pokemon.evolves_to ?? []), ...(pokemon.evolutionData?.evolves_from ?? []), ...(pokemon.evolutionData?.evolves_to ?? [])]);
  const evolutionEntries = allEntries.filter((candidate) => candidate.category === 'pokemon' && evolutionIds.has(candidate.pokemonId));
  const colors = categoryTheme(entry);
  const genders = genderOptions(pokemon);

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-pokedex-detail-screen">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: 100 }]}>
        <View style={styles.topbar}><Pressable accessibilityLabel="Back to Pokédex" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}><NativeBackIcon color={light ? '#172124' : '#ffffff'} size={20} /></Pressable><Text style={[styles.topTitle, light && styles.textLight]}>Pokédex entry</Text><View style={styles.backPlaceholder} /></View>
        <View style={[styles.hero, light && styles.heroLight]}>
          <HeroBackdrop colors={colors} light={light} />
          <View style={styles.heroTop}><Text style={styles.dex}>#{String(entry.pokedexNumber).padStart(4, '0')}</Text><Text style={styles.heroVariant}>{entry.category.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase())}</Text></View>
          <View style={styles.imageStage}>{entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, entry.imageUri) ?? undefined }} style={styles.image} /> : null}{entry.maxKind ? <Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${entry.maxKind}.png`) ?? undefined }} style={styles.maxIcon} /> : null}</View>
          <Text accessibilityRole="header" style={styles.heroTitle}>{entry.name}</Text>
          <View style={styles.traits}>{genders.length > 0 ? genders.map((gender) => <View key={gender} style={[styles.gender, gender === 'Male' ? styles.genderMale : styles.genderFemale]}><Image source={{ uri: absoluteUri(assetBaseUrl, `/images/${gender.toLocaleLowerCase()}-icon.png`) ?? undefined }} style={styles.genderIcon} /></View>) : <Text style={styles.genderless}>Genderless</Text>}{entry.typeIconUris.map((uri, index) => <View key={uri} style={styles.typeChip}><Image source={{ uri: absoluteUri(assetBaseUrl, uri) ?? undefined }} style={styles.type} /><Text style={styles.typeLabel}>{index === 0 ? pokemon.type1_name : pokemon.type2_name}</Text></View>)}</View>
          <View style={styles.registrationPill}><View style={styles.registrationPillCell}><Text style={styles.registrationPillLabel}>Registered</Text><Text style={styles.registrationPillValue}>{registeredCount}</Text></View><View style={styles.registrationPillDivider} /><View style={styles.registrationPillCell}><Text style={styles.registrationPillLabel}>Available</Text><Text style={styles.registrationPillValue}>{slots.length}</Text></View></View>
        </View>

        <View accessibilityRole="tablist" style={[styles.tabs, light && styles.cardLight]}>{TABS.map(([value, label]) => <Pressable aria-selected={tab === value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} key={value} onPress={() => setTab(value)} style={styles.tab}><Text style={[styles.tabText, light && styles.textLight, tab === value && styles.tabTextActive, light && tab === value && styles.tabTextActiveLight]}>{label}</Text>{tab === value ? <View style={[styles.tabIndicator, { backgroundColor: colors[0] }]} /> : null}</Pressable>)}</View>
        {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        {isSaving ? <View style={styles.saving}><ActivityIndicator color={colors[0]} /><Text style={[styles.savingText, light && styles.mutedLight]}>Updating Pokédex…</Text></View> : null}

        {tab === 'registered' ? <View style={styles.tabPanel}>
          <View style={styles.bulkRow}><Pressable accessibilityRole="button" disabled={!signedIn || registerableSlots.length === 0 || isSaving} onPress={() => onSetRegistrations(registerableSlots, true)} style={[styles.bulkButton, styles.bulkRegister, registerableSlots.length === 0 && styles.registrationToggleDisabled]}><Text style={styles.bulkRegisterText}>Register all</Text></Pressable><Pressable accessibilityRole="button" disabled={!signedIn || removableSlots.length === 0 || isSaving} onPress={() => onSetRegistrations(removableSlots, false)} style={[styles.bulkButton, styles.bulkRemove, removableSlots.length === 0 && styles.registrationToggleDisabled]}><Text style={styles.bulkRemoveText}>Unregister all</Text></Pressable></View>
          {groupedSlots.map((section) => <View key={section.key} style={styles.slotSection}><Text style={[styles.slotSectionTitle, light && styles.textLight]}>{section.label}</Text><View style={styles.variantGrid}>{section.slots.map((slot) => <RegistrationCard assetBaseUrl={assetBaseUrl} key={slot.id} light={light} onOpen={() => onOpenEntry(slot.entry)} onToggle={() => onToggleRegistration(slot.registration, !slot.registered)} saving={isSaving} signedIn={signedIn} slot={slot} />)}</View></View>)}
        </View> : null}

        {tab === 'info' ? <View style={styles.tabPanel}>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>BASE STATS</Text><View style={styles.stats}>{stats.map(([label, value]) => <View key={label} style={[styles.stat, light && styles.softLight]}><Text style={styles.statValue}>{formatValue(value, 0)}</Text><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text></View>)}</View></View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>AVAILABILITY</Text><Text style={[styles.body, light && styles.mutedLight]}>Released {pokemon.date_available || 'date unavailable'}</Text><Text style={[styles.body, light && styles.mutedLight]}>Shiny {pokemon.shiny_available ? `available since ${pokemon.date_shiny_available || 'release'}` : 'not available'}</Text><Text style={[styles.body, light && styles.mutedLight]}>{pokemon.costumes?.length ?? 0} costumes · {pokemon.megaEvolutions?.length ?? 0} Mega forms · {pokemon.max?.length ?? 0} Max forms</Text></View>
          {pokemon.sizes ? <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>SIZE RANGES</Text><View style={styles.sizeGrid}><View style={[styles.sizeCard, light && styles.softLight]}><Image source={{ uri: absoluteUri(assetBaseUrl, '/images/height.png') ?? undefined }} style={[styles.sizeIcon, light && styles.darkIconLight]} /><Text style={[styles.sizeTitle, light && styles.textLight]}>Height</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>Base {formatValue(pokemon.sizes.pokedex_height)} m</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>XXS ≤ {formatValue(pokemon.sizes.height_xxs_threshold)} · XXL ≥ {formatValue(pokemon.sizes.height_xxl_threshold)}</Text></View><View style={[styles.sizeCard, light && styles.softLight]}><Image source={{ uri: absoluteUri(assetBaseUrl, '/images/weight.png') ?? undefined }} style={[styles.sizeIcon, light && styles.darkIconLight]} /><Text style={[styles.sizeTitle, light && styles.textLight]}>Weight</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>Base {formatValue(pokemon.sizes.pokedex_weight)} kg</Text><Text style={[styles.sizeValue, light && styles.mutedLight]}>XXS ≤ {formatValue(pokemon.sizes.weight_xxs_threshold)} · XXL ≥ {formatValue(pokemon.sizes.weight_xxl_threshold)}</Text></View></View></View> : null}
          {evolutionEntries.length > 0 ? <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>EVOLUTION</Text><View style={styles.evolutionRail}>{evolutionEntries.map((candidate) => <Pressable accessibilityRole="button" key={candidate.id} onPress={() => onOpenEntry(candidate)} style={[styles.evolutionCard, light && styles.softLight]}>{candidate.imageUri ? <Image source={{ uri: absoluteUri(assetBaseUrl, candidate.imageUri) ?? undefined }} style={styles.evolutionImage} /> : null}<Text style={[styles.evolutionName, light && styles.textLight]}>{candidate.name}</Text></Pressable>)}</View></View> : null}
        </View> : null}

        {tab === 'battle' ? <View style={styles.tabPanel}>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={styles.eyebrow}>BATTLE PROFILE</Text><View style={styles.stats}>{stats.slice(0, 3).map(([label, value]) => <View key={label} style={[styles.stat, light && styles.softLight]}><Text style={styles.statValue}>{formatValue(value, 0)}</Text><Text style={[styles.statLabel, light && styles.mutedLight]}>{label}</Text></View>)}</View></View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={[styles.cardSectionTitle, light && styles.textLight]}>Fast moves</Text>{fastMoves.length > 0 ? fastMoves.map((move) => <MoveRow assetBaseUrl={assetBaseUrl} key={move.move_id} light={light} move={move} />) : <Text style={[styles.body, light && styles.mutedLight]}>No fast moves are listed.</Text>}</View>
          <View style={[styles.cardSection, light && styles.cardLight]}><Text style={[styles.cardSectionTitle, light && styles.textLight]}>Charged moves</Text>{chargedMoves.length > 0 ? chargedMoves.map((move) => <MoveRow assetBaseUrl={assetBaseUrl} key={move.move_id} light={light} move={move} />) : <Text style={[styles.body, light && styles.mutedLight]}>No charged moves are listed.</Text>}</View>
        </View> : null}

        {tab === 'more' ? <View style={styles.tabPanel}>
          <View style={[styles.comboHeader, light && styles.cardLight]}>{activeComboSection?.entries[0]?.imageUri ? <Image source={{ uri: absoluteUri(assetBaseUrl, activeComboSection.entries[0].imageUri) ?? undefined }} style={styles.comboHeaderImage} /> : null}<View><Text style={[styles.sectionTitle, light && styles.textLight]}>Variant combinations</Text><Text style={[styles.body, light && styles.mutedLight]}>{activeComboSection?.registeredCount ?? 0} / {activeComboSection?.combinations.length ?? 0} registered</Text></View></View>
          <View style={styles.comboSections}>{comboSections.map((section) => <Pressable accessibilityLabel={`Open combination group ${section.label}`} accessibilityRole="button" accessibilityState={{ expanded: section.id === activeComboSection?.id }} key={section.id} onPress={() => { setComboSectionId(section.id); setComboQuery(''); setComboFilters([]); }} style={[styles.comboSectionButton, light && styles.cardLight, section.id === activeComboSection?.id && styles.comboSectionButtonActive, light && section.id === activeComboSection?.id && styles.comboSectionButtonActiveLight]}>{section.entries[0]?.imageUri ? <Image source={{ uri: absoluteUri(assetBaseUrl, section.entries[0].imageUri) ?? undefined }} style={styles.comboSectionImage} /> : null}<Text numberOfLines={2} style={[styles.comboSectionLabel, light && styles.textLight]}>{section.label}</Text><Text style={[styles.comboSectionCount, light && styles.mutedLight]}>{section.registeredCount} / {section.combinations.length}</Text></Pressable>)}</View>
          <View style={[styles.comboControls, light && styles.cardLight]}>
            <Text style={styles.eyebrow}>SEARCH COMBINATIONS</Text>
            <TextInput accessibilityLabel="Search combinations" autoCapitalize="none" onChangeText={setComboQuery} placeholder="Search shiny, female, XXL, lucky, 100%…" placeholderTextColor={light ? '#64757d' : '#7f8e95'} style={[styles.comboSearch, light && styles.comboSearchLight]} value={comboQuery} />
            <Text style={[styles.comboShowing, light && styles.mutedLight]}>Showing {filteredCombos.length} of {activeComboSection?.combinations.length ?? 0}</Text>
            <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>{COMBO_FILTERS.map((filter) => <Pressable accessibilityLabel={`Filter ${filter.label}`} accessibilityRole="button" accessibilityState={{ selected: comboFilters.includes(filter.key) }} key={filter.key} onPress={() => setComboFilters((current) => toggleNativePokedexComboFilter(current, filter.key))} style={[styles.filterChip, light && styles.filterChipLight, comboFilters.includes(filter.key) && styles.filterChipActive]}><Text style={[styles.filterChipText, light && styles.textLight, comboFilters.includes(filter.key) && styles.filterChipTextActive]}>{filter.label}</Text></Pressable>)}</ScrollView>
            <View style={styles.bulkRow}><Pressable accessibilityRole="button" disabled={!signedIn || registerableCombos.length === 0 || isSaving} onPress={() => onSetRegistrations(registerableCombos, true)} style={[styles.bulkButton, styles.bulkRegister, registerableCombos.length === 0 && styles.registrationToggleDisabled]}><Text style={styles.bulkRegisterText}>Register shown</Text></Pressable><Pressable accessibilityRole="button" disabled={!signedIn || removableCombos.length === 0 || isSaving} onPress={() => onSetRegistrations(removableCombos, false)} style={[styles.bulkButton, styles.bulkRemove, removableCombos.length === 0 && styles.registrationToggleDisabled]}><Text style={styles.bulkRemoveText}>Unregister shown</Text></Pressable></View>
          </View>
          {filteredCombos.length > 0 ? <View style={styles.comboGrid}>{filteredCombos.map((combo) => <CombinationCard assetBaseUrl={assetBaseUrl} combo={combo} key={combo.id} light={light} onToggle={() => onToggleRegistration(combo.registration, !combo.registered)} saving={isSaving} signedIn={signedIn} />)}</View> : <View style={[styles.empty, light && styles.cardLight]}><Text style={[styles.body, light && styles.mutedLight]}>No combinations match this index.</Text></View>}
        </View> : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#f8fff9' }, content: { gap: 12, paddingHorizontal: 12 }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, backgroundColor: '#090d12' }, title: { color: '#fff', fontSize: 24, fontWeight: '900' }, textLight: { color: '#14232a' }, mutedLight: { color: '#586b74' }, cardLight: { borderColor: '#c2cdd3', backgroundColor: '#fff' }, softLight: { backgroundColor: '#eef4f7' }, darkIconLight: { tintColor: '#26363e' },
  topbar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515a', borderRadius: 22, backgroundColor: '#171d22' }, backLight: { borderColor: '#c1ccd2', backgroundColor: '#fff' }, backPlaceholder: { width: 44, height: 44 }, topTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  hero: { minHeight: 336, alignItems: 'center', gap: 9, overflow: 'hidden', borderWidth: 1, borderColor: '#5c7180', borderRadius: 18, backgroundColor: '#153144' }, heroLight: { borderColor: '#a9bdc7', backgroundColor: '#fff' }, heroTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingHorizontal: 14 }, dex: { color: '#fff', fontSize: 12, fontWeight: '900' }, heroVariant: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, imageStage: { width: 146, height: 138, alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '100%' }, maxIcon: { position: 'absolute', right: 0, top: 0, width: 38, height: 38, resizeMode: 'contain' }, heroTitle: { color: '#fff', fontSize: 27, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' }, traits: { minHeight: 36, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 7 }, gender: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', borderRadius: 18 }, genderMale: { backgroundColor: '#377ed7' }, genderFemale: { backgroundColor: '#e34b71' }, genderIcon: { width: 20, height: 20, tintColor: '#fff' }, genderless: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }, typeChip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: '#fff', borderRadius: 18, paddingHorizontal: 7, backgroundColor: '#ffffff33' }, type: { width: 22, height: 22 }, typeLabel: { color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, registrationPill: { width: '84%', maxWidth: 360, height: 54, flexDirection: 'row', alignItems: 'center', marginBottom: 14, borderRadius: 13, backgroundColor: '#ffffff36' }, registrationPillCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }, registrationPillDivider: { width: 1, height: 34, backgroundColor: '#ffffff66' }, registrationPillLabel: { color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, registrationPillValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: '#34424a', borderRadius: 14, backgroundColor: '#141a1f' }, tab: { position: 'relative', minHeight: 55, flex: 1, alignItems: 'center', justifyContent: 'center' }, tabText: { color: '#aeb9bf', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, tabTextActive: { color: '#fff' }, tabTextActiveLight: { color: '#14232a' }, tabIndicator: { position: 'absolute', right: '18%', bottom: 0, left: '18%', height: 4, borderRadius: 3 }, tabPanel: { gap: 14 },
  bulkRow: { flexDirection: 'row', gap: 8 }, bulkButton: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 }, bulkRegister: { borderColor: '#31925f', backgroundColor: '#dff7e9' }, bulkRemove: { borderColor: '#ae4d5e', backgroundColor: '#fde7eb' }, bulkRegisterText: { color: '#1c7247', fontSize: 10, fontWeight: '900' }, bulkRemoveText: { color: '#9a3044', fontSize: 10, fontWeight: '900' }, slotSection: { gap: 9 }, slotSectionTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, variantCard: { width: '23%', minHeight: 154, overflow: 'hidden', borderWidth: 1, borderColor: '#3b4850', borderRadius: 11, backgroundColor: '#10161a' }, variantCardRegistered: { borderColor: '#299cf5' }, variantOpen: { flex: 1, alignItems: 'center', padding: 4 }, variantStage: { width: '100%', height: 96, alignItems: 'center', justifyContent: 'center' }, variantImage: { width: '92%', height: '86%' }, variantIcon: { position: 'absolute', left: 5, top: 5, width: 21, height: 21, resizeMode: 'contain' }, variantName: { minHeight: 28, color: '#fff', fontSize: 8.5, lineHeight: 11, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }, variantState: { color: '#8e9ca3', fontSize: 7, fontWeight: '800', textTransform: 'uppercase' }, variantStateLight: { color: '#52656a' }, variantStateRegistered: { color: '#299cf5' }, variantStateRegisteredLight: { color: '#005bb5' }, registrationToggle: { position: 'absolute', right: 4, top: 4, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#168ced' }, registrationToggleActive: { backgroundColor: '#b8445a' }, registrationToggleDisabled: { opacity: 0.42 }, registrationToggleText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  cardSection: { gap: 10, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 12, backgroundColor: '#171d21' }, cardSectionTitle: { color: '#fff', fontSize: 17, fontWeight: '900' }, eyebrow: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, body: { color: '#b2bec5', fontSize: 12, lineHeight: 18 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, stat: { minWidth: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10, padding: 10, backgroundColor: '#11171b' }, statValue: { color: '#299cf5', fontSize: 18, fontWeight: '900' }, statLabel: { color: '#94a2aa', fontSize: 10, fontWeight: '800' }, sizeGrid: { gap: 8 }, sizeCard: { gap: 4, borderRadius: 11, padding: 11, backgroundColor: '#11171b' }, sizeIcon: { width: 30, height: 30, resizeMode: 'contain' }, sizeTitle: { color: '#fff', fontSize: 14, fontWeight: '900' }, sizeValue: { color: '#9eabb2', fontSize: 10.5 }, evolutionRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, evolutionCard: { width: 104, alignItems: 'center', borderRadius: 11, padding: 8, backgroundColor: '#11171b' }, evolutionImage: { width: 82, height: 82, resizeMode: 'contain' }, evolutionName: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  moveRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 10, padding: 9, backgroundColor: '#11171b' }, moveType: { width: 30, height: 30 }, moveCopy: { minWidth: 0, flex: 1 }, moveName: { color: '#fff', fontSize: 12, fontWeight: '900' }, moveMeta: { color: '#8e9ba2', fontSize: 8.5 }, moveNumbers: { alignItems: 'flex-end' }, movePower: { color: '#fff', fontSize: 14, fontWeight: '900' },
  comboHeader: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 11, backgroundColor: '#171d21' }, comboHeaderImage: { width: 62, height: 62, resizeMode: 'contain' }, comboSections: { gap: 8 }, comboSectionButton: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#34424a', borderRadius: 13, padding: 8, backgroundColor: '#171d21' }, comboSectionButtonActive: { borderColor: '#299cf5', backgroundColor: '#12314a' }, comboSectionButtonActiveLight: { backgroundColor: '#dcedf8' }, comboSectionImage: { width: 52, height: 52, resizeMode: 'contain' }, comboSectionLabel: { minWidth: 0, flex: 1, color: '#fff', fontSize: 12, fontWeight: '900' }, comboSectionCount: { color: '#9ba7ad', fontSize: 9, fontWeight: '900' }, comboControls: { gap: 9, borderWidth: 1, borderColor: '#34424a', borderRadius: 15, padding: 10, backgroundColor: '#171d21' }, comboSearch: { minHeight: 46, borderWidth: 1, borderColor: '#4a5961', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#0f1519', color: '#fff', fontSize: 12 }, comboSearchLight: { borderColor: '#aebdc5', backgroundColor: '#f7fafb', color: '#14232a' }, comboShowing: { color: '#9ba7ad', fontSize: 9, fontWeight: '800' }, filterRow: { gap: 7, paddingVertical: 2 }, filterChip: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#42515a', borderRadius: 18, paddingHorizontal: 11, backgroundColor: '#11171b' }, filterChipLight: { borderColor: '#b8c5cc', backgroundColor: '#eef4f7' }, filterChipActive: { borderColor: '#299cf5', backgroundColor: '#176aa9' }, filterChipText: { color: '#b5c0c6', fontSize: 9, fontWeight: '900' }, filterChipTextActive: { color: '#fff' }, comboGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, comboCard: { width: '31.8%', minHeight: 158, alignItems: 'center', borderWidth: 1, borderColor: '#34424a', borderRadius: 11, padding: 5, backgroundColor: '#10161a' }, comboCardRegistered: { borderColor: '#299cf5', backgroundColor: '#12314a' }, comboCardRegisteredLight: { backgroundColor: '#dcedf8' }, comboStage: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' }, comboImage: { width: '90%', height: '90%' }, comboBadges: { position: 'absolute', top: 1, left: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 2, maxWidth: '70%' }, comboBadge: { width: 17, height: 17, resizeMode: 'contain' }, comboLabel: { minHeight: 29, color: '#fff', fontSize: 8.5, lineHeight: 11, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }, comboState: { color: '#8e9ca3', fontSize: 7, fontWeight: '900', textTransform: 'uppercase' }, empty: { alignItems: 'center', borderWidth: 1, borderColor: '#34424a', borderStyle: 'dashed', borderRadius: 14, padding: 22, backgroundColor: '#171d21' },
  primary: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 18, backgroundColor: '#168ced' }, primaryText: { color: '#fff', fontWeight: '900' }, saving: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: 10, backgroundColor: '#152a39' }, savingText: { color: '#aebac0', fontSize: 10, fontWeight: '800' }, error: { borderWidth: 1, borderColor: '#df5770', borderRadius: 10, padding: 10, backgroundColor: '#39151e' }, errorText: { color: '#ffc2cc', fontSize: 11, fontWeight: '800' },
});
