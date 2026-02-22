import type { BasePokemon, Move, Pokemons } from '@pokemongonexus/shared-contracts/pokemon';
import { resolvePokemonImageUrl } from './imageUrls';

export type PokemonListItem = {
  pokemonId: number;
  displayName: string;
  form: string | null;
  types: string[];
  imageUrl: string | null;
  shinyAvailable: boolean;
  shadowShinyAvailable: boolean;
};

export type PokemonDetail = {
  pokemonId: number;
  displayName: string;
  imageUrl: string | null;
  pokedexNumber: number;
  attack: number;
  defense: number;
  stamina: number;
  cp40: number;
  cp50: number;
  types: string[];
  fastMoves: string[];
  chargedMoves: string[];
  raidBossTiers: string[];
  hasMegaEvolution: boolean;
  hasFusion: boolean;
  shinyAvailable: boolean;
  shadowShinyAvailable: boolean;
};

const toDisplayName = (name: string, form: string | null): string =>
  form && form.trim().length > 0 && form.toLowerCase() !== 'normal'
    ? `${name} (${form})`
    : name;

const toBool = (value: unknown): boolean => value === true || value === 1;

const toTypes = (pokemon: BasePokemon): string[] => {
  const types = [pokemon.type1_name, pokemon.type2_name];
  return types.filter((value): value is string => typeof value === 'string' && value.length > 0);
};

const toMoveNames = (moves: Move[], isFast: boolean): string[] =>
  moves
    .filter((move) => (isFast ? move.is_fast === 1 : move.is_fast !== 1))
    .map((move) => move.name)
    .filter((name) => name.length > 0)
    .sort((a, b) => a.localeCompare(b));

export const toPokemonListItem = (pokemon: BasePokemon): PokemonListItem => ({
  pokemonId: pokemon.pokemon_id,
  displayName: toDisplayName(pokemon.name, pokemon.form),
  form: pokemon.form,
  types: toTypes(pokemon),
  imageUrl: resolvePokemonImageUrl(pokemon.image_url),
  shinyAvailable: toBool(pokemon.shiny_available),
  shadowShinyAvailable: toBool(pokemon.shadow_shiny_available),
});

export const toPokemonList = (pokemons: Pokemons): PokemonListItem[] =>
  pokemons
    .slice()
    .sort((a, b) =>
      a.pokedex_number === b.pokedex_number
        ? a.name.localeCompare(b.name)
        : a.pokedex_number - b.pokedex_number,
    )
    .map(toPokemonListItem);

export const toPokemonDetail = (pokemon: BasePokemon): PokemonDetail => ({
  pokemonId: pokemon.pokemon_id,
  displayName: toDisplayName(pokemon.name, pokemon.form),
  imageUrl: resolvePokemonImageUrl(pokemon.image_url),
  pokedexNumber: pokemon.pokedex_number,
  attack: pokemon.attack,
  defense: pokemon.defense,
  stamina: pokemon.stamina,
  cp40: pokemon.cp40,
  cp50: pokemon.cp50,
  types: toTypes(pokemon),
  fastMoves: toMoveNames(pokemon.moves, true),
  chargedMoves: toMoveNames(pokemon.moves, false),
  raidBossTiers: pokemon.raid_boss
    .map((boss) => boss.tier)
    .filter((tier) => tier.length > 0),
  hasMegaEvolution: pokemon.megaEvolutions.length > 0,
  hasFusion: pokemon.fusion.length > 0,
  shinyAvailable: toBool(pokemon.shiny_available),
  shadowShinyAvailable: toBool(pokemon.shadow_shiny_available),
});

export const findPokemonById = (
  pokemons: Pokemons,
  pokemonId: number | null,
): BasePokemon | null => {
  if (typeof pokemonId !== 'number') return null;
  return pokemons.find((pokemon) => pokemon.pokemon_id === pokemonId) ?? null;
};
