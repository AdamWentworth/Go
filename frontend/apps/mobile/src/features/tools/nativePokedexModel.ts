import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type {
  BasePokemon,
  PokemonPokedexSpecies,
} from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildPokemonCatalogEntries,
  type PokemonCatalogEntry,
} from '@pokemongonexus/shared-domain/catalog';
import createPokemonVariants from '@pokemongonexus/app-core/pokemon-variants';
import {
  createManualPokedexRegistration,
  projectPokedexRegistrations,
  type PokedexRegistrationFacets,
} from '@pokemongonexus/app-core/pokedex-registration';
import { determineImageUrl } from '@pokemongonexus/app-core/image-helpers';

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
  femaleImageUri?: string | null;
  generation: number;
  instanceRegistered: boolean;
  manualRegistrationIds: string[];
  registered: boolean;
  registeredCategory?: boolean;
  registeredCategoryFacets?: NativePokedexRegistrationFacets[];
  registeredFacets: NativePokedexRegistrationFacets[];
  released: boolean;
  registeredSpecies: boolean;
  supportedGenders?: ('Male' | 'Female')[];
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
  // Match Vite's precedence: a shiny shadow costume is represented in the
  // Shiny Costume index, while non-shiny shadow costumes use Shadow Costume.
  if (shiny && shadow && costume) return 'shiny costume';
  if (shiny && costume) return 'shiny costume';
  if (shadow && costume) return 'shadow costume';
  if (shiny && shadow) return 'shiny shadow';
  if (costume) return 'costume';
  if (shadow) return 'shadow';
  if (shiny) return 'shiny';
  return 'pokemon';
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

const supportedGendersFor = (pokemon: BasePokemon): ('Male' | 'Female')[] => {
  const genderRate = String(pokemon.gender_rate ?? '').trim();
  if (!genderRate) return ['Male', 'Female'];

  const maleRate = genderRate.match(/(\d+)M/)?.[1];
  const femaleRate = genderRate.match(/(\d+)F/)?.[1];
  if (maleRate !== undefined || femaleRate !== undefined) {
    const supported: ('Male' | 'Female')[] = [];
    if (Number(maleRate ?? 0) > 0) supported.push('Male');
    if (Number(femaleRate ?? 0) > 0) supported.push('Female');
    return supported;
  }

  if (genderRate === 'M/M') return ['Male'];
  if (genderRate === 'F/F') return ['Female'];
  if (genderRate === 'M/F' || genderRate === 'F/M') return ['Male', 'Female'];
  return [];
};

const nativeFacetsFromCanonical = (
  facets: PokedexRegistrationFacets,
): NativePokedexRegistrationFacets => {
  const result: NativePokedexRegistrationFacets = {};
  if (facets.size === 'xxs' || facets.size === 'xs' || facets.size === 'normal' || facets.size === 'xl' || facets.size === 'xxl') result.size = facets.size;
  if (facets.gender === 'Male' || facets.gender === 'Female') result.gender = facets.gender;
  if (facets.lucky === true) result.lucky = true;
  if (facets.purified === true) result.purified = true;
  if (facets.appraisal === '4-star') result.appraisal = '4-star';
  return result;
};

/** Adds unreleased species to the native index exactly as the web Pokédex does. */
export const mergeNativePokedexSpecies = (
  releasedCatalog: BasePokemon[],
  speciesCatalog: PokemonPokedexSpecies[] = [],
): BasePokemon[] => {
  if (speciesCatalog.length === 0) return releasedCatalog;
  const releasedIds = new Set(releasedCatalog.map(({ pokemon_id: pokemonId }) => pokemonId));
  const placeholders = speciesCatalog
    .filter(({ pokemon_id: pokemonId }) => !releasedIds.has(pokemonId))
    .map((species) => ({
      pokemon_id: species.pokemon_id,
      pokedex_number: species.pokedex_number,
      name: species.name,
      form: species.form,
      generation: species.generation,
      available: 0,
      gender_rate: species.gender_rate ?? '',
      image_url: species.image_url || `/images/disabled/disabled_${species.pokemon_id}.png`,
      image_url_shiny: '',
      image_url_shadow: '',
      image_url_shiny_shadow: '',
      type_1_icon: '',
      type_2_icon: '',
      type1_name: '',
      type2_name: '',
      shiny_available: 0,
      costumes: [],
      megaEvolutions: [],
      fusion: [],
      crownForms: [],
      max: [],
    }) as unknown as BasePokemon);
  return [...releasedCatalog, ...placeholders];
};

export const buildNativePokedexEntries = (
  catalog: BasePokemon[],
  instances: Record<string, PokemonInstance> = {},
  manualRegistrations: NativePokedexManualRegistration[] = [],
): NativePokedexEntry[] => {
  const generationByPokemon = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon.generation]));
  const pokemonById = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon]));
  const catalogEntries = buildPokemonCatalogEntries(catalog);
  const catalogEntryById = new Map(catalogEntries.map((entry) => [entry.id, entry]));
  const variants = createPokemonVariants(catalog);
  const variantById = new Map(variants.map((variant) => [variant.variant_id, variant]));
  const manualByVariant = new Map<string, NativePokedexManualRegistration[]>();
  manualRegistrations.forEach((registration) => {
    const current = manualByVariant.get(registration.entryId) ?? [];
    current.push(registration);
    manualByVariant.set(registration.entryId, current);
  });
  const canonicalManualRegistrations = manualRegistrations.flatMap((registration) => {
    const variant = variantById.get(registration.entryId);
    return variant
      ? [createManualPokedexRegistration(variant, registration.facets)]
      : [];
  });
  const projectedRegistrations = projectPokedexRegistrations(
    variants,
    instances,
    canonicalManualRegistrations,
  );
  const registeredByVariant = new Map<string, typeof projectedRegistrations>();
  const registeredCategoryFacets = new Map<string, NativePokedexRegistrationFacets[]>();
  projectedRegistrations.filter(({ is_registered: registered }) => registered).forEach((registration) => {
    const current = registeredByVariant.get(registration.base_variant_id) ?? [];
    current.push(registration);
    registeredByVariant.set(registration.base_variant_id, current);

    const catalogEntry = catalogEntryById.get(registration.base_variant_id);
    if (!catalogEntry) return;
    const key = `${categoryFor(catalogEntry)}:${catalogEntry.pokedexNumber}`;
    registeredCategoryFacets.set(key, [
      ...(registeredCategoryFacets.get(key) ?? []),
      nativeFacetsFromCanonical(registration.facets),
    ]);
  });

  return catalogEntries.map((entry) => {
    const category = categoryFor(entry);
    const projectedForVariant = registeredByVariant.get(entry.id) ?? [];
    const categoryFacets = registeredCategoryFacets.get(`${category}:${entry.pokedexNumber}`) ?? [];
    const variant = variantById.get(entry.id);
    return {
      ...entry,
      category,
      femaleImageUri: variant ? determineImageUrl(true, variant) : entry.imageUri,
      generation: generationByPokemon.get(entry.pokemonId) ?? 0,
      instanceRegistered: projectedForVariant.some(({ source }) => source === 'instance'),
      manualRegistrationIds: (manualByVariant.get(entry.id) ?? []).map(({ registrationId }) => registrationId),
      registered: projectedForVariant.length > 0,
      registeredCategory: categoryFacets.length > 0,
      registeredCategoryFacets: categoryFacets,
      registeredFacets: projectedForVariant.map(({ facets }) => nativeFacetsFromCanonical(facets)),
      released: Number(pokemonById.get(entry.pokemonId)?.available ?? 1) !== 0,
      registeredSpecies: (registeredCategoryFacets.get(`pokemon:${entry.pokedexNumber}`) ?? []).length > 0,
      supportedGenders: supportedGendersFor(pokemonById.get(entry.pokemonId)!),
    };
  });
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

export const nativePokedexEntryIsRegistered = (
  entry: NativePokedexEntry,
  category: NativePokedexCategory,
  facets: NativePokedexFacet[] = [],
): boolean => {
  const registrations = category === 'pokemon' || category === 'shiny' || category === 'shadow'
    ? entry.registeredCategoryFacets ?? entry.registeredFacets
    : entry.registeredFacets;
  return registrations.some((registration) => (
    facets.every((facet) => matchesFacet(registration, facet))
  ));
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
  const filtered = entries.filter((entry) => {
    if (generation != null && entry.generation !== generation) return false;
    if (entry.category !== category) return false;
    if (facets.includes('male') && entry.supportedGenders && !entry.supportedGenders.includes('Male')) return false;
    if (facets.includes('female') && entry.supportedGenders && !entry.supportedGenders.includes('Female')) return false;
    if (category.includes('shadow') && (facets.includes('lucky') || facets.includes('purified'))) return false;
    return !normalized || entry.name.toLocaleLowerCase().includes(normalized)
      || String(entry.pokedexNumber).includes(normalized);
  });

  if (category !== 'pokemon' && category !== 'shiny' && category !== 'shadow') {
    return filtered;
  }

  // Pokémon data contains distinct records for regional and named forms that
  // can share a Pokédex number. The web Pokédex deliberately displays one row
  // per number in these three species-level categories. Preserve the first
  // canonical candidate (the API orders the default form first), falling back
  // to the lower stable Pokémon id if the input order differs.
  const byDex = new Map<number, NativePokedexEntry>();
  filtered.forEach((entry) => {
    const current = byDex.get(entry.pokedexNumber);
    if (!current || entry.pokemonId < current.pokemonId) {
      byDex.set(entry.pokedexNumber, entry);
    }
  });
  return [...byDex.values()];
};
