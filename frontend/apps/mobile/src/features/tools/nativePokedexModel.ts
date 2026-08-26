import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildPokemonCatalogEntries,
  type PokemonCatalogEntry,
} from '@pokemongonexus/shared-domain/catalog';

export type NativePokedexCategory =
  | 'pokemon'
  | 'shiny'
  | 'shadow'
  | 'costume'
  | 'mega'
  | 'dynamax'
  | 'gigantamax'
  | 'fusion'
  | 'shiny shadow'
  | 'shiny costume'
  | 'shadow costume'
  | 'shiny mega'
  | 'shiny dynamax'
  | 'shiny gigantamax'
  | 'shiny fusion';

export type NativePokedexSize = 'xxs' | 'xs' | 'normal' | 'xl' | 'xxl';

export type NativePokedexFacet =
  | 'lucky'
  | 'purified'
  | 'perfect'
  | 'male'
  | 'female'
  | 'xxs'
  | 'xs'
  | 'xl'
  | 'xxl';

export type NativePokedexRegistrationFacets = {
  appraisal?: '4-star';
  gender?: 'Male' | 'Female';
  lucky?: true;
  purified?: true;
  size?: NativePokedexSize;
};

export type NativePokedexManualRegistration = {
  entryId: string;
  facets: NativePokedexRegistrationFacets;
  registrationId: string;
};

export type NativePokedexEntry = PokemonCatalogEntry & {
  category: NativePokedexCategory;
  generation: number;
  instanceRegistered: boolean;
  manualRegistrationIds: string[];
  registered: boolean;
  registeredFacets: NativePokedexRegistrationFacets[];
  registeredSpecies: boolean;
};

const categoryFor = (entry: PokemonCatalogEntry): NativePokedexCategory => {
  const id = entry.id.toLocaleLowerCase();
  const suffix = id.slice(id.indexOf('-') + 1);
  const shiny = suffix.includes('shiny');
  if (suffix.includes('fusion')) return shiny ? 'shiny fusion' : 'fusion';
  if (suffix.includes('gigantamax')) return shiny ? 'shiny gigantamax' : 'gigantamax';
  if (suffix.includes('dynamax')) return shiny ? 'shiny dynamax' : 'dynamax';
  if (suffix.includes('mega') || suffix.includes('primal')) return shiny ? 'shiny mega' : 'mega';

  const isBaseShadow = suffix === 'shadow' || suffix === 'shiny_shadow';
  const shadow = suffix.includes('shadow');
  const isBase = suffix === 'default' || suffix === 'shiny' || isBaseShadow;
  const costume = !isBase;
  if (shiny && shadow && costume) return 'shadow costume';
  if (shiny && costume) return 'shiny costume';
  if (shadow && costume) return 'shadow costume';
  if (shiny && shadow) return 'shiny shadow';
  if (costume) return 'costume';
  if (shadow) return 'shadow';
  if (shiny) return 'shiny';
  return 'pokemon';
};

const finiteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const classifySize = (
  value: number,
  thresholds: { xxs: number; xs: number; xl: number; xxl: number },
): NativePokedexSize => {
  if (value <= thresholds.xxs) return 'xxs';
  if (value <= thresholds.xs) return 'xs';
  if (value >= thresholds.xxl) return 'xxl';
  if (value >= thresholds.xl) return 'xl';
  return 'normal';
};

const deriveSize = (pokemon: BasePokemon, instance: PokemonInstance): NativePokedexSize | undefined => {
  const sizes = pokemon.sizes;
  if (!sizes) return undefined;
  const height = finiteNumber(instance.height);
  if (height !== null) {
    return classifySize(height, {
      xxs: sizes.height_xxs_threshold,
      xs: sizes.height_xs_threshold,
      xl: sizes.height_xl_threshold,
      xxl: sizes.height_xxl_threshold,
    });
  }
  const weight = finiteNumber(instance.weight);
  if (weight !== null) {
    return classifySize(weight, {
      xxs: sizes.weight_xxs_threshold,
      xs: sizes.weight_xs_threshold,
      xl: sizes.weight_xl_threshold,
      xxl: sizes.weight_xxl_threshold,
    });
  }
  return undefined;
};

const registrationFacetsFor = (
  pokemon: BasePokemon,
  instance: PokemonInstance,
): NativePokedexRegistrationFacets => {
  const facets: NativePokedexRegistrationFacets = {};
  const size = deriveSize(pokemon, instance);
  if (size) facets.size = size;
  if (instance.lucky) facets.lucky = true;
  if (instance.purified) facets.purified = true;
  if (instance.gender === 'Male' || instance.gender === 'Female') facets.gender = instance.gender;
  if (finiteNumber(instance.attack_iv) === 15 && finiteNumber(instance.defense_iv) === 15 && finiteNumber(instance.stamina_iv) === 15) facets.appraisal = '4-star';
  return facets;
};

const matchesFacet = (
  facets: NativePokedexRegistrationFacets,
  facet: NativePokedexFacet,
): boolean => {
  if (facet === 'male') return facets.gender === 'Male';
  if (facet === 'female') return facets.gender === 'Female';
  if (facet === 'perfect') return facets.appraisal === '4-star';
  if (facet === 'lucky' || facet === 'purified') return facets[facet] === true;
  return facets.size === facet;
};

const isRegistrationSource = (instance: PokemonInstance): boolean => (
  Boolean(instance.registered || instance.is_caught || instance.is_for_trade)
);

export const buildNativePokedexEntries = (
  catalog: BasePokemon[],
  instances: Record<string, PokemonInstance> = {},
  manualRegistrations: NativePokedexManualRegistration[] = [],
): NativePokedexEntry[] => {
  const generationByPokemon = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon.generation]));
  const pokemonById = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon]));
  const registeredInstances = Object.values(instances).filter(isRegistrationSource);
  const instancesByVariant = new Map<string, PokemonInstance[]>();
  const registeredPokemonIds = new Set<number>();
  registeredInstances.forEach((instance) => {
    registeredPokemonIds.add(instance.pokemon_id);
    const current = instancesByVariant.get(instance.variant_id) ?? [];
    current.push(instance);
    instancesByVariant.set(instance.variant_id, current);
  });
  const manualByVariant = new Map<string, NativePokedexManualRegistration[]>();
  manualRegistrations.forEach((registration) => {
    const current = manualByVariant.get(registration.entryId) ?? [];
    current.push(registration);
    manualByVariant.set(registration.entryId, current);
  });
  const manuallyRegisteredPokemonIds = new Set(
    buildPokemonCatalogEntries(catalog)
      .filter((entry) => manualByVariant.has(entry.id))
      .map((entry) => entry.pokemonId),
  );
  return buildPokemonCatalogEntries(catalog).map((entry) => ({
    ...entry,
    category: categoryFor(entry),
    generation: generationByPokemon.get(entry.pokemonId) ?? 0,
    instanceRegistered: instancesByVariant.has(entry.id),
    manualRegistrationIds: (manualByVariant.get(entry.id) ?? []).map(({ registrationId }) => registrationId),
    registered: instancesByVariant.has(entry.id) || manualByVariant.has(entry.id),
    registeredFacets: [
      ...(instancesByVariant.get(entry.id) ?? []).map((instance) => (
        registrationFacetsFor(pokemonById.get(entry.pokemonId)!, instance)
      )),
      ...(manualByVariant.get(entry.id) ?? []).map(({ facets }) => facets),
    ],
    registeredSpecies: registeredPokemonIds.has(entry.pokemonId) || manuallyRegisteredPokemonIds.has(entry.pokemonId),
  }));
};

const registrationFacetOrder: (keyof NativePokedexRegistrationFacets)[] = [
  'size', 'lucky', 'purified', 'gender', 'appraisal',
];

export const buildNativePokedexRegistrationId = (
  entryId: string,
  facets: NativePokedexRegistrationFacets = {},
): string => {
  const suffix = registrationFacetOrder.flatMap((key) => {
    const value = facets[key];
    return value == null ? [] : [`${key}:${String(value).toLocaleLowerCase()}`];
  }).join('|');
  return suffix ? `${entryId}|${suffix}` : entryId;
};

export const filterNativePokedexEntries = ({
  category,
  entries,
  facets = [],
  generation,
  query,
}: {
  category: NativePokedexCategory;
  entries: NativePokedexEntry[];
  facets?: NativePokedexFacet[];
  generation: number | null;
  query: string;
}): NativePokedexEntry[] => {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    if (generation != null && entry.generation !== generation) return false;
    if (entry.category !== category) return false;
    if (facets.length > 0 && !entry.registeredFacets.some((registration) => (
      facets.every((facet) => matchesFacet(registration, facet))
    ))) return false;
    return !normalized || entry.name.toLocaleLowerCase().includes(normalized)
      || String(entry.pokedexNumber).includes(normalized);
  });
};
