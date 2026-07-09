import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';

export type PokedexRegistrationFacetValue = string | number | boolean | null;
export type PokedexRegistrationFacets = Record<string, PokedexRegistrationFacetValue>;
export type PokedexRegistrationSource = 'catalog' | 'instance';
export type PokedexRegistrationLevel = 'base' | 'derived' | 'exact';
export type PokedexSizeClass = 'xxs' | 'xs' | 'normal' | 'xl' | 'xxl';

export interface PokedexRegistrationEntry {
  registration_id: string;
  pokemon_id: number;
  pokedex_number: number | null;
  base_variant_id: string;
  species_name: string;
  form: string | null;
  variant_type: string;
  facets: PokedexRegistrationFacets;
  is_registered: boolean;
  registered_at: string | null;
  source: PokedexRegistrationSource;
  source_instance_id: string | null;
  level: PokedexRegistrationLevel;
}

const FACET_ORDER = [
  'variant',
  'size',
  'background',
  'lucky',
  'purified',
  'gender',
  'appraisal',
  'ball',
] as const;

function toSlug(value: unknown): string {
  return String(value ?? 'none')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'none';
}

function facetSortKey(key: string): string {
  const index = FACET_ORDER.indexOf(key as (typeof FACET_ORDER)[number]);
  return index === -1 ? `z-${key}` : String(index).padStart(2, '0');
}

function normalizeFacets(facets: PokedexRegistrationFacets): PokedexRegistrationFacets {
  return Object.fromEntries(
    Object.entries(facets)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .sort(([left], [right]) => facetSortKey(left).localeCompare(facetSortKey(right))),
  );
}

export function buildPokedexRegistrationId(input: {
  pokemon_id: number;
  form?: string | null;
  facets: PokedexRegistrationFacets;
}): string {
  const normalizedFacets = normalizeFacets(input.facets);
  const facetSegments = Object.entries(normalizedFacets).map(
    ([key, value]) => `${toSlug(key)}:${toSlug(value)}`,
  );

  return [
    `species:${input.pokemon_id}`,
    `form:${toSlug(input.form || 'normal')}`,
    ...facetSegments,
  ].join('|');
}

function createRegistrationEntry(input: {
  variant: PokemonVariant;
  facets: PokedexRegistrationFacets;
  isRegistered: boolean;
  registeredAt: string | null;
  source: PokedexRegistrationSource;
  sourceInstanceId: string | null;
  level: PokedexRegistrationLevel;
}): PokedexRegistrationEntry {
  const facets = normalizeFacets(input.facets);

  return {
    registration_id: buildPokedexRegistrationId({
      pokemon_id: input.variant.pokemon_id,
      form: input.variant.form,
      facets,
    }),
    pokemon_id: input.variant.pokemon_id,
    pokedex_number:
      typeof input.variant.pokedex_number === 'number' ? input.variant.pokedex_number : null,
    base_variant_id: input.variant.variant_id,
    species_name: input.variant.species_name || input.variant.name,
    form: input.variant.form ?? null,
    variant_type: input.variant.variantType,
    facets,
    is_registered: input.isRegistered,
    registered_at: input.registeredAt,
    source: input.source,
    source_instance_id: input.sourceInstanceId,
    level: input.level,
  };
}

export function projectCatalogRegistration(variant: PokemonVariant): PokedexRegistrationEntry {
  return createRegistrationEntry({
    variant,
    facets: { variant: variant.variantType },
    isRegistered: false,
    registeredAt: null,
    source: 'catalog',
    sourceInstanceId: null,
    level: 'base',
  });
}

function asFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function classifyAgainstThresholds(
  value: number,
  thresholds: {
    xxs: number;
    xs: number;
    xl: number;
    xxl: number;
  },
): PokedexSizeClass {
  if (value <= thresholds.xxs) return 'xxs';
  if (value <= thresholds.xs) return 'xs';
  if (value >= thresholds.xxl) return 'xxl';
  if (value >= thresholds.xl) return 'xl';
  return 'normal';
}

export function deriveInstanceSizeClass(
  variant: PokemonVariant,
  instance: PokemonInstance,
): PokedexSizeClass | null {
  const sizeData = variant.sizes;
  if (!sizeData) return null;

  const height = asFiniteNumber(instance.height);
  if (height !== null) {
    return classifyAgainstThresholds(height, {
      xxs: sizeData.height_xxs_threshold,
      xs: sizeData.height_xs_threshold,
      xl: sizeData.height_xl_threshold,
      xxl: sizeData.height_xxl_threshold,
    });
  }

  const weight = asFiniteNumber(instance.weight);
  if (weight !== null) {
    return classifyAgainstThresholds(weight, {
      xxs: sizeData.weight_xxs_threshold,
      xs: sizeData.weight_xs_threshold,
      xl: sizeData.weight_xl_threshold,
      xxl: sizeData.weight_xxl_threshold,
    });
  }

  return null;
}

export function deriveAppraisalFacet(instance: PokemonInstance): string | null {
  const attack = asFiniteNumber(instance.attack_iv);
  const defense = asFiniteNumber(instance.defense_iv);
  const stamina = asFiniteNumber(instance.stamina_iv);
  if (attack === null || defense === null || stamina === null) return null;

  const total = attack + defense + stamina;
  if (total >= 45) return '4-star';
  if (total >= 37) return '3-star';
  if (total >= 30) return '2-star';
  if (total >= 23) return '1-star';
  return '0-star';
}

function isRegistrationSource(instance: PokemonInstance): boolean {
  return Boolean(instance.registered || instance.is_caught || instance.is_for_trade);
}

function getRegisteredAt(instance: PokemonInstance): string | null {
  return instance.date_caught || instance.date_added || null;
}

function getQualityFacets(
  variant: PokemonVariant,
  instance: PokemonInstance,
): PokedexRegistrationFacets {
  const facets: PokedexRegistrationFacets = {};
  const sizeClass = deriveInstanceSizeClass(variant, instance);
  const appraisal = deriveAppraisalFacet(instance);

  if (sizeClass) facets.size = sizeClass;
  if (instance.location_card) facets.background = instance.location_card;
  if (instance.lucky) facets.lucky = true;
  if (instance.purified) facets.purified = true;
  if (instance.gender) facets.gender = instance.gender;
  if (appraisal) facets.appraisal = appraisal;
  if (instance.pokeball) facets.ball = instance.pokeball;

  return facets;
}

function buildFacetSubsets(facets: PokedexRegistrationFacets): PokedexRegistrationFacets[] {
  const entries = Object.entries(normalizeFacets(facets));
  const subsets: PokedexRegistrationFacets[] = [];

  const visit = (index: number, current: PokedexRegistrationFacets) => {
    if (index >= entries.length) {
      if (Object.keys(current).length > 0) {
        subsets.push(current);
      }
      return;
    }

    visit(index + 1, current);
    const [key, value] = entries[index];
    visit(index + 1, { ...current, [key]: value });
  };

  visit(0, {});
  return subsets;
}

export function projectInstanceRegistrations(
  variant: PokemonVariant,
  instance: PokemonInstance,
): PokedexRegistrationEntry[] {
  if (!isRegistrationSource(instance)) return [];

  const registeredAt = getRegisteredAt(instance);
  const sourceInstanceId = instance.instance_id ?? null;
  const qualityFacets = getQualityFacets(variant, instance);
  const qualityFacetCount = Object.keys(qualityFacets).length;
  const entries: PokedexRegistrationEntry[] = [
    createRegistrationEntry({
      variant,
      facets: { variant: variant.variantType },
      isRegistered: true,
      registeredAt,
      source: 'instance',
      sourceInstanceId,
      level: qualityFacetCount === 0 ? 'exact' : 'base',
    }),
  ];

  for (const subset of buildFacetSubsets(qualityFacets)) {
    const subsetCount = Object.keys(subset).length;
    entries.push(
      createRegistrationEntry({
        variant,
        facets: { variant: variant.variantType, ...subset },
        isRegistered: true,
        registeredAt,
        source: 'instance',
        sourceInstanceId,
        level: subsetCount === qualityFacetCount ? 'exact' : 'derived',
      }),
    );
  }

  return entries;
}

function mergeRegistrationEntries(
  current: PokedexRegistrationEntry,
  next: PokedexRegistrationEntry,
): PokedexRegistrationEntry {
  const isRegistered = current.is_registered || next.is_registered;
  const currentIsRegistered = current.is_registered;
  const nextIsRegistered = next.is_registered;

  return {
    ...current,
    is_registered: isRegistered,
    registered_at:
      currentIsRegistered && current.registered_at
        ? current.registered_at
        : nextIsRegistered
        ? next.registered_at
        : current.registered_at,
    source: current.source === 'instance' || next.source === 'instance' ? 'instance' : 'catalog',
    source_instance_id:
      current.source_instance_id ?? next.source_instance_id ?? null,
    level: current.level === 'base' ? next.level : current.level,
  };
}

export function projectPokedexRegistrations(
  variants: PokemonVariant[],
  instances: Instances = {},
): PokedexRegistrationEntry[] {
  const byId = new Map<string, PokedexRegistrationEntry>();
  const variantById = new Map(variants.map((variant) => [variant.variant_id, variant]));

  for (const variant of variants) {
    const entry = projectCatalogRegistration(variant);
    byId.set(entry.registration_id, entry);
  }

  for (const instance of Object.values(instances)) {
    if (!instance) continue;
    const variant = variantById.get(instance.variant_id);
    if (!variant) continue;

    for (const entry of projectInstanceRegistrations(variant, instance)) {
      const current = byId.get(entry.registration_id);
      byId.set(
        entry.registration_id,
        current ? mergeRegistrationEntries(current, entry) : entry,
      );
    }
  }

  return Array.from(byId.values());
}
