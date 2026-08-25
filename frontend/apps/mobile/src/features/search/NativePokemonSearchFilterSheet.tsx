import type { Coordinates, LocationSuggestion } from '@pokemongonexus/shared-contracts/location';
import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  NativeOptionPicker,
  type NativeOptionPickerEntry,
} from '../../components/NativeOptionPicker';
import { getNativeLocationSuggestions } from '../../services/locationApi';
import {
  countNativePokemonSearchFilters,
  nativePokemonSearchPreviewImage,
  normalizeNativePokemonSelection,
  selectNativePokemonSearchBackground,
  setNativePokemonSearchMaxMode,
  setNativePokemonSearchOwnership,
  type NativePokemonSearchDraft,
} from './nativePokemonSearchDraft';

export type NativeSearchFilterSection = 'pokemon' | 'location' | 'matching';

type SavedLocation = Coordinates & { label: string };

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  draft: NativePokemonSearchDraft;
  error?: string | null;
  initialSection?: NativeSearchFilterSection;
  isSearching?: boolean;
  notice?: string | null;
  onApply: () => void;
  onChange: (draft: NativePokemonSearchDraft) => void;
  onClose: () => void;
  onNotice: (notice: string | null) => void;
  onReset: () => void;
  savedLocation?: SavedLocation | null;
  visible: boolean;
};

type PickerState = {
  title: string;
  options: NativeOptionPickerEntry[];
  selectedKey: string | null;
  searchable?: boolean;
  onSelect: (option: NativeOptionPickerEntry) => void;
} | null;

const absoluteUri = (value: string | null | undefined, origin: string): string | null => {
  if (!value) return null;
  try { return new URL(value, origin).toString(); } catch { return null; }
};

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pokemonKey = (pokemon: BasePokemon): string => `${pokemon.pokemon_id}:${pokemon.form ?? ''}`;

const displayPokemonName = (pokemon: BasePokemon): string => (
  pokemon.form?.trim() ? `${pokemon.form.trim()} ${pokemon.name}` : pokemon.name
);

const optionForPokemon = (
  pokemon: BasePokemon,
  assetBaseUrl: string,
): NativeOptionPickerEntry => ({
  key: pokemonKey(pokemon),
  label: displayPokemonName(pokemon),
  description: `#${String(pokemon.pokedex_number).padStart(4, '0')}`,
  imageUri: absoluteUri(pokemon.image_url, assetBaseUrl),
});

const fieldLabel = (value: string | null | undefined, fallback = 'Any'): string => (
  value?.trim() || fallback
);

const SectionButton = ({
  active,
  label,
  light,
  onPress,
}: {
  active: boolean;
  label: string;
  light: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[
      styles.sectionButton,
      light && styles.sectionButtonLight,
      active && styles.sectionButtonActive,
      active && light && styles.sectionButtonActiveLight,
    ]}
  >
    <Text style={[
      styles.sectionButtonText,
      light && styles.secondaryLight,
      active && styles.sectionButtonTextActive,
    ]}>{label}</Text>
  </Pressable>
);

const Choice = ({
  active,
  disabled = false,
  imageUri,
  label,
  light,
  onPress,
  detail,
}: {
  active: boolean;
  disabled?: boolean;
  imageUri?: string | null;
  label: string;
  light: boolean;
  onPress: () => void;
  detail?: string;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled, selected: active }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.choice,
      light && styles.choiceLight,
      active && styles.choiceActive,
      active && light && styles.choiceActiveLight,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    {imageUri ? <Image resizeMode="contain" source={{ uri: imageUri }} style={styles.choiceIcon} /> : null}
    <Text style={[styles.choiceLabel, light && styles.textLight]}>{label}</Text>
    <Text style={[styles.choiceDetail, light && styles.secondaryLight]}>{detail ?? (active ? 'Required' : 'Any')}</Text>
  </Pressable>
);

const SelectField = ({ label, light, onPress, value }: { label: string; light: boolean; onPress: () => void; value: string }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[styles.selectField, light && styles.selectFieldLight]}>
    <View style={styles.selectFieldCopy}>
      <Text style={[styles.fieldLabel, light && styles.secondaryLight]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.selectValue, light && styles.textLight]}>{value}</Text>
    </View>
    <Text style={[styles.chevron, light && styles.textLight]}>⌄</Text>
  </Pressable>
);

const ToggleRow = ({
  description,
  label,
  light,
  onChange,
  value,
}: {
  description: string;
  label: string;
  light: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleCopy}>
      <Text style={[styles.toggleLabel, light && styles.textLight]}>{label}</Text>
      <Text style={[styles.toggleDescription, light && styles.secondaryLight]}>{description}</Text>
    </View>
    <Switch
      accessibilityLabel={label}
      onValueChange={onChange}
      thumbColor={value ? '#eafffb' : '#d6dcdd'}
      trackColor={{ false: '#536063', true: '#178d77' }}
      value={value}
    />
  </View>
);

const Stepper = ({
  label,
  light,
  max,
  min,
  onChange,
  step = 1,
  suffix = '',
  value,
}: {
  label: string;
  light: boolean;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
}) => (
  <View style={styles.stepper}>
    <Text style={[styles.stepperLabel, light && styles.textLight]}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={[styles.stepperButton, light && styles.stepperButtonLight]}>
        <Text style={[styles.stepperButtonText, light && styles.textLight]}>−</Text>
      </Pressable>
      <Text style={[styles.stepperValue, light && styles.textLight]}>{value}{suffix}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={[styles.stepperButton, light && styles.stepperButtonLight]}>
        <Text style={[styles.stepperButtonText, light && styles.textLight]}>+</Text>
      </Pressable>
    </View>
  </View>
);

const IvStepper = ({ label, light, onChange, value }: { label: string; light: boolean; onChange: (value: number | null) => void; value: number | null }) => (
  <View style={styles.ivField}>
    <Text style={[styles.fieldLabel, light && styles.secondaryLight]}>{label}</Text>
    <View style={styles.ivControls}>
      <Pressable accessibilityRole="button" onPress={() => onChange(value == null ? 0 : value <= 0 ? null : value - 1)} style={[styles.miniButton, light && styles.miniButtonLight]}>
        <Text style={[styles.miniButtonText, light && styles.textLight]}>−</Text>
      </Pressable>
      <Text style={[styles.ivValue, light && styles.textLight]}>{value == null ? 'Any' : `${value}/15`}</Text>
      <Pressable accessibilityRole="button" onPress={() => onChange(value == null ? 0 : Math.min(15, value + 1))} style={[styles.miniButton, light && styles.miniButtonLight]}>
        <Text style={[styles.miniButtonText, light && styles.textLight]}>+</Text>
      </Pressable>
    </View>
  </View>
);

export const NativePokemonSearchFilterSheet = ({
  assetBaseUrl,
  catalog,
  draft,
  error = null,
  initialSection = 'pokemon',
  isSearching = false,
  notice = null,
  onApply,
  onChange,
  onClose,
  onNotice,
  onReset,
  savedLocation = null,
  visible,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [section, setSection] = useState<NativeSearchFilterSection>(initialSection);
  const [picker, setPicker] = useState<PickerState>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const pokemon = useMemo(() => catalog.find((candidate) => (
    candidate.pokemon_id === draft.pokemonId
    && (candidate.form ?? null) === draft.form
  )) ?? catalog.find((candidate) => candidate.pokemon_id === draft.pokemonId) ?? null, [catalog, draft.form, draft.pokemonId]);
  const imageUri = nativePokemonSearchPreviewImage(draft, pokemon);
  const background = pokemon?.backgrounds?.find((candidate) => candidate.background_id === draft.backgroundId);
  const selectedCostume = pokemon?.costumes?.find((candidate) => candidate.costume_id === draft.costumeId);
  const hasDynamax = Boolean(pokemon?.max?.some((entry) => entry.dynamax));
  const hasGigantamax = Boolean(pokemon?.max?.some((entry) => entry.gigantamax));
  const moves = pokemon?.moves ?? [];
  const fastMoves = moves.filter((move) => Boolean(move.is_fast));
  const chargedMoves = moves.filter((move) => !move.is_fast);

  useEffect(() => {
    if (!visible || section !== 'location' || draft.city.trim().length < 3) {
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void getNativeLocationSuggestions(draft.city)
        .then((suggestions) => { if (active) setLocationSuggestions(suggestions); })
        .catch(() => { if (active) setLocationSuggestions([]); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [draft.city, section, visible]);

  const openPicker = (next: NonNullable<PickerState>) => setPicker(next);
  const closePicker = () => setPicker(null);
  const choosePokemon = () => openPicker({
    title: 'Choose a Pokémon',
    searchable: true,
    selectedKey: pokemon ? pokemonKey(pokemon) : null,
    options: [...catalog]
      .sort((left, right) => left.pokedex_number - right.pokedex_number || displayPokemonName(left).localeCompare(displayPokemonName(right)))
      .map((candidate) => optionForPokemon(candidate, assetBaseUrl)),
    onSelect: (option) => {
      const selected = catalog.find((candidate) => pokemonKey(candidate) === option.key);
      if (selected) onChange(normalizeNativePokemonSelection(draft, selected));
      closePicker();
    },
  });
  const chooseSimple = ({
    title,
    selectedKey,
    entries,
    onSelect,
  }: {
    title: string;
    selectedKey: string | null;
    entries: NativeOptionPickerEntry[];
    onSelect: (key: string) => void;
  }) => openPicker({
    title,
    options: entries,
    selectedKey,
    onSelect: (option) => { onSelect(option.key); closePicker(); },
  });
  const moveOptions = (moveList: Move[]): NativeOptionPickerEntry[] => [
    { key: '', label: 'Any move' },
    ...moveList.map((move) => ({
      key: String(move.move_id),
      label: move.name,
      description: move.legacy ? `${move.type_name} · Legacy` : move.type_name,
    })),
  ];
  const moveName = (id: number | null) => moves.find((move) => move.move_id === id)?.name ?? 'Any move';

  const pokemonSection = (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>POKÉMON DETAILS</Text>
      <Text style={[styles.sectionTitle, light && styles.textLight]}>Choose the exact variant</Text>
      <Text style={[styles.sectionDescription, light && styles.secondaryLight]}>Every field is optional after choosing a Pokémon. Add only the details that matter.</Text>
      <Pressable
        accessibilityLabel="Choose Pokémon"
        accessibilityRole="button"
        onPress={choosePokemon}
        style={[styles.pokemonSelect, light && styles.pokemonSelectLight]}
      >
        <View style={styles.pokemonSelectCopy}>
          <Text style={[styles.fieldLabel, light && styles.secondaryLight]}>Pokémon</Text>
          <Text style={[styles.pokemonSelectName, light && styles.textLight]}>{pokemon ? displayPokemonName(pokemon) : 'Choose a Pokémon'}</Text>
        </View>
        <Text style={[styles.chevron, light && styles.textLight]}>⌄</Text>
      </Pressable>
      <View
        style={[
          styles.preview,
          light && styles.previewLight,
          background?.image_url ? { backgroundColor: '#14282c' } : null,
        ]}
      >
        {background?.image_url ? <Image resizeMode="cover" source={{ uri: absoluteUri(background.image_url, assetBaseUrl) ?? '' }} style={StyleSheet.absoluteFill} /> : null}
        {imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(imageUri, assetBaseUrl) ?? imageUri }} style={styles.previewImage} /> : <Text style={styles.previewPlaceholder}>Select a Pokémon</Text>}
        {draft.gigantamax || draft.dynamax ? (
          <Image
            resizeMode="contain"
            source={{ uri: `${assetBaseUrl.replace(/\/$/, '')}/images/${draft.gigantamax ? 'gigantamax' : 'dynamax'}.png` }}
            style={styles.maxBadge}
          />
        ) : null}
      </View>
      <View style={styles.choiceGrid}>
        <Choice active={draft.shiny} disabled={!pokemon} imageUri={`${assetBaseUrl.replace(/\/$/, '')}/images/shiny_icon.png`} label="Shiny" light={light} onPress={() => onChange({ ...draft, shiny: !draft.shiny })} />
        <Choice active={draft.shadow} disabled={!pokemon || draft.dynamax || draft.gigantamax} imageUri={`${assetBaseUrl.replace(/\/$/, '')}/images/shadow_icon.png`} label="Shadow" light={light} onPress={() => onChange({ ...draft, shadow: !draft.shadow })} />
        <Choice active={draft.costumeId != null} disabled={!pokemon?.costumes?.length || draft.dynamax || draft.gigantamax} imageUri={`${assetBaseUrl.replace(/\/$/, '')}/images/costume_icon.png`} label="Costume" light={light} detail={selectedCostume?.name ?? 'Any'} onPress={() => pokemon && chooseSimple({
          title: 'Choose a costume', selectedKey: draft.costumeId == null ? '' : String(draft.costumeId),
          entries: [{ key: '', label: 'Any costume' }, ...(pokemon.costumes ?? []).map((costume) => ({ key: String(costume.costume_id), label: costume.name }))],
          onSelect: (key) => onChange({ ...draft, costumeId: key ? Number(key) : null, backgroundId: null }),
        })} />
      </View>
      {pokemon && (hasDynamax || hasGigantamax) ? (
        <View style={[styles.card, light && styles.cardLight]}>
          <Text style={[styles.cardTitle, light && styles.textLight]}>Max form</Text>
          <View style={styles.segmented}>
            <Choice active={!draft.dynamax && !draft.gigantamax} label="Standard" light={light} onPress={() => onChange(setNativePokemonSearchMaxMode(draft, 'standard'))} />
            {hasDynamax ? <Choice active={draft.dynamax} label="Dynamax" light={light} onPress={() => onChange(setNativePokemonSearchMaxMode(draft, 'dynamax'))} /> : null}
            {hasGigantamax ? <Choice active={draft.gigantamax} label="Gigantamax" light={light} onPress={() => onChange(setNativePokemonSearchMaxMode(draft, 'gigantamax'))} /> : null}
          </View>
        </View>
      ) : null}
      {pokemon ? (
        <View style={[styles.card, light && styles.cardLight]}>
          <Text style={[styles.cardTitle, light && styles.textLight]}>Gender, moves, and background</Text>
          <SelectField label="Gender" light={light} value={fieldLabel(draft.gender)} onPress={() => chooseSimple({
            title: 'Choose a gender', selectedKey: draft.gender ?? '',
            entries: ['Any', 'Male', 'Female', 'Genderless'].map((label) => ({ key: label === 'Any' ? '' : label, label })),
            onSelect: (key) => onChange({ ...draft, gender: key || null }),
          })} />
          <SelectField label="Fast move" light={light} value={moveName(draft.fastMoveId)} onPress={() => chooseSimple({
            title: 'Choose a fast move', selectedKey: draft.fastMoveId == null ? '' : String(draft.fastMoveId), entries: moveOptions(fastMoves),
            onSelect: (key) => onChange({ ...draft, fastMoveId: key ? Number(key) : null }),
          })} />
          <SelectField label="Charged move 1" light={light} value={moveName(draft.chargedMove1Id)} onPress={() => chooseSimple({
            title: 'Choose charged move 1', selectedKey: draft.chargedMove1Id == null ? '' : String(draft.chargedMove1Id), entries: moveOptions(chargedMoves),
            onSelect: (key) => onChange({ ...draft, chargedMove1Id: key ? Number(key) : null }),
          })} />
          <SelectField label="Charged move 2" light={light} value={moveName(draft.chargedMove2Id)} onPress={() => chooseSimple({
            title: 'Choose charged move 2', selectedKey: draft.chargedMove2Id == null ? '' : String(draft.chargedMove2Id), entries: moveOptions(chargedMoves),
            onSelect: (key) => onChange({ ...draft, chargedMove2Id: key ? Number(key) : null }),
          })} />
          <SelectField label="Location background" light={light} value={background?.location || background?.name || 'Any background'} onPress={() => chooseSimple({
            title: 'Choose a location background', selectedKey: draft.backgroundId == null ? '' : String(draft.backgroundId),
            entries: [{ key: '', label: 'Any background' }, ...(pokemon.backgrounds ?? []).map((entry) => ({ key: String(entry.background_id), label: entry.location || entry.name, imageUri: absoluteUri(entry.image_url, assetBaseUrl) }))],
            onSelect: (key) => {
              const selection = selectNativePokemonSearchBackground(draft, pokemon, key ? Number(key) : null);
              onChange(selection.draft);
              onNotice(selection.notice);
            },
          })} />
        </View>
      ) : null}
    </View>
  );

  const locationSection = (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SEARCH AREA</Text>
      <Text style={[styles.sectionTitle, light && styles.textLight]}>Where should we look?</Text>
      <Text style={[styles.sectionDescription, light && styles.secondaryLight]}>Your exact coordinates are never shown in search results.</Text>
      {savedLocation ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onChange({ ...draft, city: savedLocation.label, latitude: savedLocation.latitude, longitude: savedLocation.longitude });
            setLocationSuggestions([]);
          }}
          style={[
            styles.savedLocation,
            light && styles.savedLocationLight,
            draft.latitude === savedLocation.latitude && draft.longitude === savedLocation.longitude && styles.savedLocationActive,
          ]}
        >
          <Text style={[styles.savedLocationTitle, light && styles.textLight]}>⌖  Use saved location</Text>
          <Text style={[styles.savedLocationCopy, light && styles.secondaryLight]}>{savedLocation.label}</Text>
        </Pressable>
      ) : null}
      <View style={[styles.card, light && styles.cardLight]}>
        <Text style={[styles.fieldLabel, light && styles.secondaryLight]}>City or place</Text>
        <TextInput
          accessibilityLabel="City or place"
          onChangeText={(city) => {
            setLocationSuggestions([]);
            onChange({ ...draft, city, latitude: null, longitude: null });
          }}
          placeholder="Search for a city"
          placeholderTextColor={light ? '#667477' : '#8a999c'}
          style={[styles.locationInput, light && styles.locationInputLight]}
          value={draft.city}
        />
        {locationSuggestions.map((suggestion, index) => {
          const latitude = toNumber(suggestion.latitude);
          const longitude = toNumber(suggestion.longitude);
          return (
            <Pressable
              accessibilityRole="button"
              disabled={latitude == null || longitude == null}
              key={`${suggestion.displayName}-${index}`}
              onPress={() => {
                if (latitude == null || longitude == null) return;
                onChange({ ...draft, city: suggestion.displayName, latitude, longitude });
                setLocationSuggestions([]);
              }}
              style={[styles.locationSuggestion, light && styles.locationSuggestionLight]}
            >
              <Text style={[styles.locationSuggestionText, light && styles.textLight]}>⌖  {suggestion.displayName}</Text>
            </Pressable>
          );
        })}
        {draft.city && draft.latitude != null && draft.longitude != null ? (
          <Text style={styles.locationSelected}>✓ Search center selected</Text>
        ) : null}
      </View>
      <View style={[styles.card, light && styles.cardLight]}>
        <Text style={[styles.cardTitle, light && styles.textLight]}>Distance and results</Text>
        <Stepper label="Search radius" light={light} max={25} min={1} onChange={(rangeKm) => onChange({ ...draft, rangeKm })} suffix=" km" value={draft.rangeKm} />
        <Stepper label="Maximum results" light={light} max={100} min={5} onChange={(limit) => onChange({ ...draft, limit })} step={5} value={draft.limit} />
      </View>
    </View>
  );

  const matchingSection = (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>LISTING TYPE</Text>
      <Text style={[styles.sectionTitle, light && styles.textLight]}>What kind of match?</Text>
      <Text style={[styles.sectionDescription, light && styles.secondaryLight]}>Choose a listing type, then add only the filters relevant to it.</Text>
      <View style={styles.ownershipGrid}>
        {(['caught', 'trade', 'wanted'] as const).map((ownership) => (
          <Choice
            active={draft.ownership === ownership}
            detail={ownership === 'caught' ? 'Collections' : ownership === 'trade' ? 'Offers' : 'Wishlists'}
            key={ownership}
            label={ownership === 'caught' ? 'Caught' : ownership === 'trade' ? 'For Trade' : 'Wanted'}
            light={light}
            onPress={() => onChange(setNativePokemonSearchOwnership(draft, ownership))}
          />
        ))}
      </View>
      {draft.ownership === 'caught' ? (
        <View style={[styles.card, light && styles.cardLight]}>
          <View style={styles.cardHeadingRow}>
            <View style={styles.cardHeadingCopy}>
              <Text style={[styles.cardTitle, light && styles.textLight]}>Individual values</Text>
              <Text style={[styles.cardCopy, light && styles.secondaryLight]}>Leave a stat at Any to accept 0–15.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => onChange({ ...draft, attackIv: 15, defenseIv: 15, staminaIv: 15 })} style={[styles.compactButton, light && styles.compactButtonLight]}>
              <Text style={styles.compactButtonText}>Perfect IVs</Text>
            </Pressable>
          </View>
          <View style={styles.ivGrid}>
            <IvStepper label="Attack" light={light} onChange={(attackIv) => onChange({ ...draft, attackIv })} value={draft.attackIv} />
            <IvStepper label="Defense" light={light} onChange={(defenseIv) => onChange({ ...draft, defenseIv })} value={draft.defenseIv} />
            <IvStepper label="HP" light={light} onChange={(staminaIv) => onChange({ ...draft, staminaIv })} value={draft.staminaIv} />
          </View>
        </View>
      ) : null}
      {draft.ownership === 'trade' ? (
        <View style={[styles.card, light && styles.cardLight]}>
          <Text style={[styles.cardTitle, light && styles.textLight]}>Trade compatibility</Text>
          <ToggleRow
            description="They want at least one Pokémon from your For Trade list."
            label="Mutual matches only"
            light={light}
            onChange={(onlyMatchingTrades) => onChange({ ...draft, onlyMatchingTrades })}
            value={draft.onlyMatchingTrades}
          />
        </View>
      ) : null}
      {draft.ownership === 'wanted' ? (
        <>
          <View style={[styles.card, light && styles.cardLight]}>
            <Text style={[styles.cardTitle, light && styles.textLight]}>Friendship and trade type</Text>
            <Text style={[styles.cardCopy, light && styles.secondaryLight]}>Choose the exact friendship condition on the wanted listing.</Text>
            <View style={styles.hearts}>
              {Array.from({ length: 6 }, (_, level) => (
                <Pressable accessibilityRole="button"
                  accessibilityLabel={level === 0 ? 'Any friendship level' : `${level} hearts`}
                  key={level}
                  onPress={() => onChange({
                    ...draft,
                    friendshipLevel: level,
                    prefLucky: level < 4 ? false : draft.prefLucky,
                  })}
                  style={[
                    styles.heartButton,
                    light && styles.heartButtonLight,
                    draft.friendshipLevel === level && styles.heartButtonActive,
                  ]}
                >
                  <Text style={styles.heartText}>{level === 0 ? 'Any' : `${'♥'.repeat(level)}`}</Text>
                </Pressable>
              ))}
            </View>
            {draft.friendshipLevel === 5 ? <Text style={styles.remoteNotice}>Remote trade eligible</Text> : null}
            <ToggleRow
              description="Requires at least four hearts."
              label="Lucky trade preferred"
              light={light}
              onChange={(prefLucky) => onChange({ ...draft, prefLucky, friendshipLevel: prefLucky ? Math.max(4, draft.friendshipLevel) : draft.friendshipLevel })}
              value={draft.prefLucky}
            />
          </View>
          <View style={[styles.card, light && styles.cardLight]}>
            <Text style={[styles.cardTitle, light && styles.textLight]}>Collection compatibility</Text>
            <ToggleRow description="Only show Pokémon already registered in your Pokédex." label="Already registered" light={light} onChange={(alreadyRegistered) => onChange({ ...draft, alreadyRegistered })} value={draft.alreadyRegistered} />
            <ToggleRow description="They offer at least one Pokémon from your Wanted list." label="Wishlist matches only" light={light} onChange={(tradeInWantedList) => onChange({ ...draft, tradeInWantedList })} value={draft.tradeInWantedList} />
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <Modal animationType="slide" hardwareAccelerated onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <View style={[styles.screen, light && styles.screenLight]} testID="native-pokemon-search-filter-sheet">
        <View style={[styles.header, light && styles.headerLight]}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>☷ SEARCH FILTERS</Text>
            <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Refine your search</Text>
          </View>
          <Pressable accessibilityLabel="Close search filters" accessibilityRole="button" onPress={onClose} style={[styles.close, light && styles.closeLight]}>
            <Text style={[styles.closeText, light && styles.textLight]}>×</Text>
          </Pressable>
        </View>
        <View accessibilityRole="tablist" style={[styles.tabs, light && styles.tabsLight]}>
          <SectionButton active={section === 'pokemon'} label="Pokémon" light={light} onPress={() => setSection('pokemon')} />
          <SectionButton active={section === 'location'} label="Location" light={light} onPress={() => setSection('location')} />
          <SectionButton active={section === 'matching'} label="Matching" light={light} onPress={() => setSection('matching')} />
        </View>
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
        {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {section === 'pokemon' ? pokemonSection : section === 'location' ? locationSection : matchingSection}
        </ScrollView>
        <View style={[styles.footer, light && styles.footerLight]}>
          <Pressable accessibilityRole="button" onPress={onReset} style={[styles.resetButton, light && styles.resetButtonLight]}>
            <Text style={[styles.resetButtonText, light && styles.textLight]}>Reset filters</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={isSearching} onPress={onApply} style={[styles.applyButton, isSearching && styles.disabled]}>
            <Text style={styles.applyButtonText}>{isSearching ? 'Searching…' : `Apply & search${countNativePokemonSearchFilters(draft) ? ` · ${countNativePokemonSearchFilters(draft)}` : ''}`}</Text>
          </Pressable>
        </View>
        {picker ? (
          <NativeOptionPicker
            onClose={closePicker}
            onSelect={picker.onSelect}
            options={picker.options}
            searchable={picker.searchable}
            selectedKey={picker.selectedKey}
            title={picker.title}
            visible
          />
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#090d0f' },
  screenLight: { backgroundColor: '#eef4f5' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#334347', backgroundColor: '#0e1416' },
  headerLight: { borderBottomColor: '#b6c2c4', backgroundColor: '#ffffff' },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#2f9cff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 1, color: '#f8fcfd', fontSize: 21, fontWeight: '900' },
  close: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#58696c', borderRadius: 23 },
  closeLight: { borderColor: '#89989b' },
  closeText: { color: '#ffffff', fontSize: 28 },
  tabs: { minHeight: 58, flexDirection: 'row', gap: 7, padding: 8, borderBottomWidth: 1, borderBottomColor: '#28383b', backgroundColor: '#0e1416' },
  tabsLight: { borderBottomColor: '#c3cdcf', backgroundColor: '#ffffff' },
  sectionButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 9 },
  sectionButtonLight: { backgroundColor: '#f5f8f8' },
  sectionButtonActive: { borderColor: '#2f9cff', backgroundColor: '#12375c' },
  sectionButtonActiveLight: { backgroundColor: '#1767ad' },
  sectionButtonText: { color: '#a5b0b2', fontSize: 13, fontWeight: '800' },
  sectionButtonTextActive: { color: '#ffffff' },
  notice: { marginHorizontal: 10, marginTop: 8, padding: 9, color: '#c9fff3', fontSize: 12, textAlign: 'center', borderWidth: 1, borderColor: '#27866e', borderRadius: 8, backgroundColor: '#123128' },
  error: { marginHorizontal: 10, marginTop: 8, padding: 10, color: '#ffd5db', fontSize: 13, fontWeight: '800', textAlign: 'center', borderWidth: 1, borderColor: '#b74d60', borderRadius: 8, backgroundColor: '#401c25' },
  scrollContent: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 12, paddingBottom: 30 },
  section: { gap: 12 },
  sectionEyebrow: { color: '#2f9cff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: '#f7fbfc', fontSize: 22, fontWeight: '900' },
  sectionDescription: { marginTop: -8, color: '#a6b1b3', fontSize: 13, lineHeight: 19 },
  pokemonSelect: { minHeight: 62, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#516568', borderRadius: 11, backgroundColor: '#161e20' },
  pokemonSelectLight: { borderColor: '#a7b6b9', backgroundColor: '#ffffff' },
  pokemonSelectCopy: { flex: 1, minWidth: 0 },
  pokemonSelectName: { marginTop: 3, color: '#f7fbfc', fontSize: 17, fontWeight: '900' },
  preview: { height: 178, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#506064', borderRadius: 14, backgroundColor: '#151b1d' },
  previewLight: { borderColor: '#a7b6b9', backgroundColor: '#ffffff' },
  previewImage: { width: '82%', height: '82%' },
  previewPlaceholder: { color: '#8d9a9d', fontWeight: '800' },
  maxBadge: { position: 'absolute', width: 52, height: 52, top: 18, right: '14%' },
  choiceGrid: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, minWidth: 0, minHeight: 72, alignItems: 'center', justifyContent: 'center', padding: 7, borderWidth: 1, borderColor: '#506064', borderRadius: 10, backgroundColor: '#202729' },
  choiceLight: { borderColor: '#a7b5b8', backgroundColor: '#ffffff' },
  choiceActive: { borderColor: '#2f9cff', backgroundColor: '#174474' },
  choiceActiveLight: { backgroundColor: '#dceeff' },
  choiceIcon: { width: 29, height: 29 },
  choiceLabel: { color: '#f3f8f9', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  choiceDetail: { marginTop: 2, color: '#b6c0c2', fontSize: 10, textAlign: 'center' },
  card: { gap: 10, padding: 12, borderWidth: 1, borderColor: '#4d5b5e', borderRadius: 12, backgroundColor: '#24292b' },
  cardLight: { borderColor: '#acb9bc', backgroundColor: '#ffffff' },
  cardTitle: { color: '#f6fafb', fontSize: 16, fontWeight: '900' },
  cardCopy: { color: '#a9b4b6', fontSize: 12, lineHeight: 17 },
  segmented: { flexDirection: 'row', gap: 7 },
  selectField: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#59686b', borderRadius: 9, backgroundColor: '#181e20' },
  selectFieldLight: { borderColor: '#a8b5b8', backgroundColor: '#f5f8f8' },
  selectFieldCopy: { flex: 1, minWidth: 0 },
  fieldLabel: { color: '#aebabc', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  selectValue: { marginTop: 3, color: '#f3f8f9', fontSize: 14, fontWeight: '800' },
  chevron: { color: '#dce5e6', fontSize: 22 },
  savedLocation: { padding: 14, borderWidth: 1, borderColor: '#4d666a', borderRadius: 11, backgroundColor: '#162023' },
  savedLocationLight: { borderColor: '#a6b7ba', backgroundColor: '#ffffff' },
  savedLocationActive: { borderColor: '#36c5a4', backgroundColor: '#15342d' },
  savedLocationTitle: { color: '#f3f8f9', fontSize: 15, fontWeight: '900' },
  savedLocationCopy: { marginTop: 3, color: '#aab7b9', fontSize: 12 },
  locationInput: { minHeight: 50, paddingHorizontal: 12, color: '#ffffff', fontSize: 15, borderWidth: 1, borderColor: '#647477', borderRadius: 9, backgroundColor: '#141a1c' },
  locationInputLight: { color: '#172124', borderColor: '#98a8ab', backgroundColor: '#ffffff' },
  locationSuggestion: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#46575a', borderRadius: 8, backgroundColor: '#182022' },
  locationSuggestionLight: { borderColor: '#a7b4b7', backgroundColor: '#f4f7f7' },
  locationSuggestionText: { color: '#eaf1f2', fontSize: 13, fontWeight: '700' },
  locationSelected: { color: '#62dfbc', fontSize: 12, fontWeight: '900' },
  stepper: { gap: 7, paddingVertical: 4 },
  stepperLabel: { color: '#dce5e6', fontSize: 13, fontWeight: '800' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepperButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#667579', borderRadius: 9, backgroundColor: '#151b1d' },
  stepperButtonLight: { borderColor: '#9eadaf', backgroundColor: '#f4f7f7' },
  stepperButtonText: { color: '#ffffff', fontSize: 23, fontWeight: '700' },
  stepperValue: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  ownershipGrid: { flexDirection: 'row', gap: 7 },
  toggleRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  toggleCopy: { flex: 1, minWidth: 0 },
  toggleLabel: { color: '#f1f6f7', fontSize: 14, fontWeight: '900' },
  toggleDescription: { marginTop: 3, color: '#aab5b7', fontSize: 11, lineHeight: 16 },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeadingCopy: { flex: 1, minWidth: 0 },
  compactButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#2f9cff', borderRadius: 8 },
  compactButtonLight: { backgroundColor: '#e7f3ff' },
  compactButtonText: { color: '#8fc9ff', fontSize: 11, fontWeight: '900' },
  ivGrid: { gap: 7 },
  ivField: { flexDirection: 'row', alignItems: 'center' },
  ivControls: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#667579', borderRadius: 8 },
  miniButtonLight: { borderColor: '#9eadaf', backgroundColor: '#f4f7f7' },
  miniButtonText: { color: '#ffffff', fontSize: 20 },
  ivValue: { width: 58, color: '#ffffff', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  hearts: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  heartButton: { minWidth: 46, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderWidth: 1, borderColor: '#5b696c', borderRadius: 9, backgroundColor: '#171e20' },
  heartButtonLight: { borderColor: '#a0adaf', backgroundColor: '#f4f7f7' },
  heartButtonActive: { borderColor: '#ff6849', backgroundColor: '#593329' },
  heartText: { color: '#ff7459', fontSize: 12, fontWeight: '900' },
  remoteNotice: { color: '#75d7ff', fontSize: 12, fontWeight: '900' },
  footer: { minHeight: 72, flexDirection: 'row', gap: 9, padding: 10, borderTopWidth: 1, borderTopColor: '#344448', backgroundColor: '#0e1416' },
  footerLight: { borderTopColor: '#b6c2c4', backgroundColor: '#ffffff' },
  resetButton: { flex: 0.72, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#59686b', borderRadius: 10 },
  resetButtonLight: { borderColor: '#8e9c9f' },
  resetButtonText: { color: '#d9e2e3', fontSize: 13, fontWeight: '900' },
  applyButton: { flex: 1.35, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#138cff' },
  applyButtonText: { color: '#051421', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  textLight: { color: '#172124' },
  secondaryLight: { color: '#566467' },
});
