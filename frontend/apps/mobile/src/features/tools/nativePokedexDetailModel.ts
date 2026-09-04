import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
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
  releaseDate: string | null;
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

const TYPE_NAMES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
] as const;

const ATTACK_TYPE_CHART: Record<string, { resisted: string[]; strong: string[] }> = {
  bug: { strong: ['grass', 'psychic', 'dark'], resisted: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  dark: { strong: ['psychic', 'ghost'], resisted: ['fighting', 'dark', 'fairy'] },
  dragon: { strong: ['dragon'], resisted: ['steel', 'fairy'] },
  electric: { strong: ['water', 'flying'], resisted: ['electric', 'grass', 'dragon', 'ground'] },
  fairy: { strong: ['fighting', 'dragon', 'dark'], resisted: ['fire', 'poison', 'steel'] },
  fighting: { strong: ['normal', 'ice', 'rock', 'dark', 'steel'], resisted: ['poison', 'flying', 'psychic', 'bug', 'ghost', 'fairy'] },
  fire: { strong: ['grass', 'ice', 'bug', 'steel'], resisted: ['fire', 'water', 'rock', 'dragon'] },
  flying: { strong: ['grass', 'fighting', 'bug'], resisted: ['electric', 'rock', 'steel'] },
  ghost: { strong: ['psychic', 'ghost'], resisted: ['dark', 'normal'] },
  grass: { strong: ['water', 'ground', 'rock'], resisted: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ground: { strong: ['fire', 'electric', 'poison', 'rock', 'steel'], resisted: ['grass', 'bug', 'flying'] },
  ice: { strong: ['grass', 'ground', 'flying', 'dragon'], resisted: ['fire', 'water', 'ice', 'steel'] },
  normal: { strong: [], resisted: ['rock', 'ghost', 'steel'] },
  poison: { strong: ['grass', 'fairy'], resisted: ['poison', 'ground', 'rock', 'ghost', 'steel'] },
  psychic: { strong: ['fighting', 'poison'], resisted: ['psychic', 'steel', 'dark'] },
  rock: { strong: ['fire', 'ice', 'flying', 'bug'], resisted: ['fighting', 'ground', 'steel'] },
  steel: { strong: ['ice', 'rock', 'fairy'], resisted: ['fire', 'water', 'electric', 'steel'] },
  water: { strong: ['fire', 'ground', 'rock'], resisted: ['water', 'grass', 'dragon'] },
};

const evolutionIds = (pokemon: BasePokemon, key: 'evolves_from' | 'evolves_to'): number[] => {
  const direct = pokemon[key];
  const nested = pokemon.evolutionData?.[key];
  const value = Array.isArray(direct) ? direct : nested;
  return Array.isArray(value)
    ? value.map(Number).filter((candidate) => Number.isFinite(candidate))
    : [];
};

export const buildNativePokedexEvolutionLine = (
  catalog: BasePokemon[],
  pokemon: BasePokemon,
): BasePokemon[] => {
  const byId = new Map(catalog.map((candidate) => [candidate.pokemon_id, candidate]));
  if (!byId.has(pokemon.pokemon_id)) byId.set(pokemon.pokemon_id, pokemon);
  const adjacency = new Map<number, Set<number>>();
  const connect = (left: number, right: number) => {
    if (!byId.has(left) || !byId.has(right)) return;
    adjacency.set(left, new Set([...(adjacency.get(left) ?? []), right]));
    adjacency.set(right, new Set([...(adjacency.get(right) ?? []), left]));
  };
  byId.forEach((candidate) => {
    [...evolutionIds(candidate, 'evolves_from'), ...evolutionIds(candidate, 'evolves_to')]
      .forEach((linkedId) => connect(candidate.pokemon_id, linkedId));
  });
  const family = new Set<number>();
  const pending = [pokemon.pokemon_id];
  while (pending.length > 0) {
    const current = pending.pop() as number;
    if (family.has(current)) continue;
    family.add(current);
    adjacency.get(current)?.forEach((linkedId) => pending.push(linkedId));
  }
  const depthCache = new Map<number, number>();
  const depth = (candidate: BasePokemon, trail = new Set<number>()): number => {
    const cached = depthCache.get(candidate.pokemon_id);
    if (cached != null) return cached;
    const parents = evolutionIds(candidate, 'evolves_from').filter((id) => byId.has(id) && !trail.has(id));
    if (parents.length === 0) return 0;
    const nextTrail = new Set(trail).add(candidate.pokemon_id);
    const result = 1 + Math.min(...parents.map((id) => depth(byId.get(id) as BasePokemon, nextTrail)));
    depthCache.set(candidate.pokemon_id, result);
    return result;
  };
  return [...family]
    .map((id) => byId.get(id))
    .filter((candidate): candidate is BasePokemon => Boolean(candidate))
    .sort((left, right) => depth(left) - depth(right) || Number(left.pokedex_number ?? left.pokemon_id) - Number(right.pokedex_number ?? right.pokemon_id));
};

export const getNativePokedexTypeEffectiveness = (
  pokemon: BasePokemon,
): { resistantTo: string[]; weakTo: string[] } => {
  const defendingTypes = [pokemon.type1_name, pokemon.type2_name]
    .map((type) => String(type ?? '').trim().toLocaleLowerCase())
    .filter(Boolean);
  const resistantTo: string[] = [];
  const weakTo: string[] = [];
  TYPE_NAMES.forEach((typeName) => {
    const attack = ATTACK_TYPE_CHART[typeName.toLocaleLowerCase()];
    const multiplier = defendingTypes.reduce((current, defendingType) => {
      if (attack.strong.includes(defendingType)) return current * 1.6;
      if (attack.resisted.includes(defendingType)) return current * 0.625;
      return current;
    }, 1);
    if (multiplier > 1.01) weakTo.push(typeName);
    else if (multiplier < 0.99) resistantTo.push(typeName);
  });
  return { resistantTo, weakTo };
};

export const getNativePokedexMoveEnergyBarCount = (move: Move): number => {
  const energy = Math.abs(Number(move.pvp_energy || move.raid_energy || 0));
  if (energy >= 100) return 1;
  if (energy >= 50) return 2;
  if (energy > 0) return 3;
  return 0;
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
  return {
    entry,
    facets,
    icon,
    id: registration.registrationId,
    label,
    registration,
    releaseDate: section === 'costume' ? entry.releaseDate ?? null : null,
    section,
    ...state,
  };
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
