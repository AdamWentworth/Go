import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildNativePokedexRegistrationId,
  type NativePokedexEntry,
  type NativePokedexManualRegistration,
  type NativePokedexRegistrationFacets,
} from './nativePokedexModel';

export type NativePokedexDetailSectionKey =
  | 'registered'
  | 'costume'
  | 'shadow'
  | 'mega'
  | 'max'
  | 'fusion'
  | 'special';

export type NativePokedexComboFilter =
  | 'registered'
  | 'missing'
  | 'pokemon'
  | 'shiny'
  | 'male'
  | 'female'
  | 'xxs'
  | 'xs'
  | 'xl'
  | 'xxl'
  | 'lucky'
  | 'perfect';

export type NativePokedexRegistrationSlot = {
  entry: NativePokedexEntry;
  facets: NativePokedexRegistrationFacets;
  icon: string | null;
  id: string;
  label: string;
  lockedByInstance: boolean;
  registered: boolean;
  registration: NativePokedexManualRegistration;
  section: NativePokedexDetailSectionKey;
};

export type NativePokedexCombination = {
  entry: NativePokedexEntry;
  facets: NativePokedexRegistrationFacets;
  id: string;
  label: string;
  lockedByInstance: boolean;
  registered: boolean;
  registration: NativePokedexManualRegistration;
};

export type NativePokedexCombinationSection = {
  combinations: NativePokedexCombination[];
  entries: NativePokedexEntry[];
  id: string;
  label: string;
  registeredCount: number;
};

const facetOrder: (keyof NativePokedexRegistrationFacets)[] = [
  'gender', 'size', 'purified', 'lucky', 'appraisal',
];

const facetsEqual = (
  left: NativePokedexRegistrationFacets,
  right: NativePokedexRegistrationFacets,
): boolean => facetOrder.every((key) => left[key] === right[key]);

const stateFor = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets,
): { lockedByInstance: boolean; registered: boolean } => {
  const id = buildNativePokedexRegistrationId(entry.id, facets);
  const manual = entry.manualRegistrationIds.includes(id);
  const registered = manual || entry.registeredFacets.some((candidate) => facetsEqual(candidate, facets));
  return { lockedByInstance: registered && !manual, registered };
};

const registrationFor = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets,
): NativePokedexManualRegistration => ({
  entryId: entry.id,
  facets,
  registrationId: buildNativePokedexRegistrationId(entry.id, facets),
});

const sectionFor = (entry: NativePokedexEntry): NativePokedexDetailSectionKey => {
  if (entry.category.includes('costume')) return 'costume';
  if (entry.category.includes('shadow')) return 'shadow';
  if (entry.category.includes('mega')) return 'mega';
  if (entry.category.includes('dynamax') || entry.category.includes('gigantamax')) return 'max';
  if (entry.category.includes('fusion')) return 'fusion';
  if (entry.category === 'pokemon' || entry.category === 'shiny') return 'registered';
  return 'special';
};

const iconForEntry = (entry: NativePokedexEntry): string | null => {
  if (entry.category.includes('costume')) return '/images/costume_icon.png';
  if (entry.category.includes('shadow')) return '/images/shadow_icon.png';
  if (entry.category.includes('mega')) return '/images/mega.png';
  if (entry.category.includes('gigantamax')) return '/images/gigantamax-icon.png';
  if (entry.category.includes('dynamax')) return '/images/dynamax-icon.png';
  if (entry.category.includes('fusion')) return '/images/fusion_1.png';
  return null;
};

const createSlot = (
  entry: NativePokedexEntry,
  label: string,
  section: NativePokedexDetailSectionKey,
  facets: NativePokedexRegistrationFacets = {},
  icon: string | null = iconForEntry(entry),
): NativePokedexRegistrationSlot => {
  const state = stateFor(entry, facets);
  const registration = registrationFor(entry, facets);
  return { entry, facets, icon, id: registration.registrationId, label, section, registration, ...state };
};

const isShiny = (entry: NativePokedexEntry): boolean => entry.category.includes('shiny');
const isShadow = (entry: NativePokedexEntry): boolean => entry.category.includes('shadow');

export const buildNativePokedexRegistrationSlots = (
  allEntries: NativePokedexEntry[],
  pokemonId: number,
): NativePokedexRegistrationSlot[] => {
  const speciesEntries = allEntries.filter((entry) => entry.pokemonId === pokemonId);
  const base = speciesEntries.find((entry) => entry.category === 'pokemon') ?? speciesEntries[0];
  if (!base) return [];
  const shinyCandidate = speciesEntries.find((entry) => entry.category === 'shiny');
  const shiny = shinyCandidate === base ? undefined : shinyCandidate;
  const formEntries = speciesEntries.filter((entry) => entry !== base && entry !== shiny);
  const shadowEntries = formEntries.filter(isShadow);

  return [
    createSlot(base, 'Pokémon', 'registered', {}, '/images/pokedex-icon.png'),
    ...(shiny ? [createSlot(shiny, 'Shiny', 'registered')] : []),
    createSlot(base, '100%', 'registered', { appraisal: '4-star' }, '/images/appraisal_04.png'),
    createSlot(base, 'Lucky', 'registered', { lucky: true }, '/images/lucky-icon.png'),
    createSlot(base, 'XXL', 'registered', { size: 'xxl' }, '/images/xxl.png'),
    createSlot(base, 'XXS', 'registered', { size: 'xxs' }, '/images/xxs.png'),
    ...formEntries.map((entry) => createSlot(entry, entry.name, sectionFor(entry))),
    ...(shadowEntries.length > 0 ? [createSlot(base, 'Purified', 'shadow', { purified: true }, '/images/purified.png')] : []),
    ...shadowEntries.filter(isShiny).map((entry) => createSlot(entry, 'Shiny Purified', 'shadow', { purified: true }, '/images/purified.png')),
  ];
};

const genderOptionsFor = (pokemon: BasePokemon): ('Male' | 'Female')[] => {
  const rate = String(pokemon.gender_rate ?? '').toLocaleUpperCase();
  if (rate === 'GENDERLESS' || rate === 'NONE') return [];
  if (rate === 'M/M') return ['Male'];
  if (rate === 'F/F') return ['Female'];
  if (rate === 'M/F' || rate === 'F/M' || !rate) return ['Male', 'Female'];
  const options: ('Male' | 'Female')[] = [];
  if (Number(rate.match(/(\d+)M/)?.[1] ?? 0) > 0) options.push('Male');
  if (Number(rate.match(/(\d+)F/)?.[1] ?? 0) > 0) options.push('Female');
  return options;
};

const combinationLabel = (
  entry: NativePokedexEntry,
  facets: NativePokedexRegistrationFacets,
): string => [
  isShiny(entry) ? 'Shiny' : null,
  facets.purified ? 'Purified' : null,
  facets.gender,
  facets.size ? facets.size.toLocaleUpperCase() : null,
  facets.lucky ? 'Lucky' : null,
  facets.appraisal ? '100%' : null,
].filter(Boolean).join(' ') || entry.name;

const combinationsFor = (
  entry: NativePokedexEntry,
  pokemon: BasePokemon,
): NativePokedexCombination[] => {
  const genderFacets: NativePokedexRegistrationFacets[] = [
    {}, ...genderOptionsFor(pokemon).map((gender) => ({ gender })),
  ];
  const sizeFacets: NativePokedexRegistrationFacets[] = [
    {}, { size: 'xxs' }, { size: 'xs' }, { size: 'xl' }, { size: 'xxl' },
  ];
  const luckyFacets: NativePokedexRegistrationFacets[] = isShadow(entry) ? [{}] : [{}, { lucky: true }];
  const appraisalFacets: NativePokedexRegistrationFacets[] = [{}, { appraisal: '4-star' }];
  const combinations: NativePokedexCombination[] = [];

  for (const gender of genderFacets) for (const size of sizeFacets) {
    for (const lucky of luckyFacets) for (const appraisal of appraisalFacets) {
      const facets = { ...gender, ...size, ...lucky, ...appraisal };
      const state = stateFor(entry, facets);
      const registration = registrationFor(entry, facets);
      combinations.push({
        entry,
        facets,
        id: registration.registrationId,
        label: combinationLabel(entry, facets),
        registration,
        ...state,
      });
    }
  }
  return combinations;
};

const familyKeyFor = (entry: NativePokedexEntry): string => {
  if (entry.category === 'pokemon' || entry.category === 'shiny') return entry.id;
  return entry.id
    .replace(/shiny[_-]?/gi, '')
    .replace(/(^|[-_])shiny($|[-_])/gi, '$1')
    .replace(/[-_]+/g, '-');
};

export const buildNativePokedexCombinationSections = (
  allEntries: NativePokedexEntry[],
  pokemon: BasePokemon,
): NativePokedexCombinationSection[] => {
  const speciesEntries = allEntries.filter((entry) => entry.pokemonId === pokemon.pokemon_id);
  const grouped = new Map<string, NativePokedexEntry[]>();
  speciesEntries.forEach((entry) => {
    const key = familyKeyFor(entry);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  });
  return [...grouped.entries()].map(([id, entries]) => {
    const combinations = entries.flatMap((entry) => combinationsFor(entry, pokemon));
    return {
      combinations,
      entries,
      id,
      label: entries.length > 1
        ? entries.map(({ name }) => name.replace(/^Shiny\s+/i, '')).filter((name, index, names) => names.indexOf(name) === index).join(' / ')
        : entries[0]?.name ?? 'Variant',
      registeredCount: combinations.filter(({ registered }) => registered).length,
    };
  });
};

const FILTER_GROUPS: Record<NativePokedexComboFilter, string> = {
  registered: 'status', missing: 'status', pokemon: 'variant', shiny: 'variant',
  male: 'gender', female: 'gender', xxs: 'size', xs: 'size', xl: 'size', xxl: 'size',
  lucky: 'quality', perfect: 'quality',
};

const matchesFilter = (combo: NativePokedexCombination, filter: NativePokedexComboFilter): boolean => {
  if (filter === 'registered') return combo.registered;
  if (filter === 'missing') return !combo.registered;
  if (filter === 'pokemon') return !isShiny(combo.entry);
  if (filter === 'shiny') return isShiny(combo.entry);
  if (filter === 'male' || filter === 'female') return combo.facets.gender?.toLocaleLowerCase() === filter;
  if (filter === 'xxs' || filter === 'xs' || filter === 'xl' || filter === 'xxl') return combo.facets.size === filter;
  if (filter === 'lucky') return combo.facets.lucky === true;
  return combo.facets.appraisal === '4-star';
};

export const filterNativePokedexCombinations = (
  combinations: NativePokedexCombination[],
  query: string,
  filters: NativePokedexComboFilter[],
): NativePokedexCombination[] => {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const groups = filters.reduce<Record<string, NativePokedexComboFilter[]>>((result, filter) => {
    const group = FILTER_GROUPS[filter];
    result[group] = [...(result[group] ?? []), filter];
    return result;
  }, {});
  return combinations.filter((combo) => {
    const text = `${combo.label} ${combo.entry.name} ${combo.registered ? 'registered' : 'missing'}`.toLocaleLowerCase();
    if (!tokens.every((token) => text.includes(token))) return false;
    return Object.entries(groups).every(([group, groupFilters]) => group === 'quality'
      ? groupFilters.every((filter) => matchesFilter(combo, filter))
      : groupFilters.some((filter) => matchesFilter(combo, filter)));
  });
};

export const toggleNativePokedexComboFilter = (
  current: NativePokedexComboFilter[],
  filter: NativePokedexComboFilter,
): NativePokedexComboFilter[] => {
  if (current.includes(filter)) return current.filter((candidate) => candidate !== filter);
  const group = FILTER_GROUPS[filter];
  const exclusive = group !== 'quality';
  return [...(exclusive ? current.filter((candidate) => FILTER_GROUPS[candidate] !== group) : current), filter];
};
