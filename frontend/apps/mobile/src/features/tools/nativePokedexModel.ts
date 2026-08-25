import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildPokemonCatalogEntries,
  type PokemonCatalogEntry,
} from '@pokemongonexus/shared-domain/catalog';

export type NativePokedexCategory = 'all' | 'shiny' | 'shadow' | 'costume' | 'mega' | 'max';

export type NativePokedexEntry = PokemonCatalogEntry & {
  category: NativePokedexCategory;
  generation: number;
  registered: boolean;
};

const categoryFor = (entry: PokemonCatalogEntry): NativePokedexCategory => {
  const id = entry.id.toLocaleLowerCase();
  if (entry.maxKind) return 'max';
  if (id.includes('mega') || id.includes('primal') || id.includes('fusion')) return 'mega';
  if (id.includes('shadow')) return 'shadow';
  if (id.includes('shiny')) return 'shiny';
  const suffix = id.slice(id.indexOf('-') + 1);
  if (suffix !== 'default') return 'costume';
  return 'all';
};

export const buildNativePokedexEntries = (
  catalog: BasePokemon[],
  instances: Record<string, PokemonInstance> = {},
): NativePokedexEntry[] => {
  const generationByPokemon = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon.generation]));
  const registered = new Set(
    Object.values(instances)
      .filter((instance) => Boolean(instance.registered || instance.is_caught || instance.is_for_trade))
      .map((instance) => instance.variant_id)
      .filter((id): id is string => Boolean(id)),
  );
  return buildPokemonCatalogEntries(catalog).map((entry) => ({
    ...entry,
    category: categoryFor(entry),
    generation: generationByPokemon.get(entry.pokemonId) ?? 0,
    registered: registered.has(entry.id),
  }));
};

export const filterNativePokedexEntries = ({
  category,
  entries,
  generation,
  query,
}: {
  category: NativePokedexCategory;
  entries: NativePokedexEntry[];
  generation: number | null;
  query: string;
}): NativePokedexEntry[] => {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    if (generation != null && entry.generation !== generation) return false;
    if (category !== 'all') {
      if (category === 'shiny' && !entry.id.toLocaleLowerCase().includes('shiny')) return false;
      else if (category !== 'shiny' && entry.category !== category) return false;
    }
    return !normalized || entry.name.toLocaleLowerCase().includes(normalized)
      || String(entry.pokedexNumber).includes(normalized);
  });
};
