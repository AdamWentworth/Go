import { describe, expect, it } from 'vitest';

import { checkTermMatches } from '@/features/query/matchers/checkTermMatches';
import { matchesSearchTerm } from '@/features/query/matchers/matchesSearchTerm';
import type { PokemonVariant } from '@/types/pokemonVariants';

const makePokemon = (
  speciesName: string,
  overrides: Partial<PokemonVariant> = {},
): PokemonVariant =>
  ({
    pokemon_id: 1,
    pokedex_number: 1,
    name: speciesName,
    species_name: speciesName,
    variant_id: speciesName.toLowerCase().replace(/\s+/g, '-'),
    variantType: 'default',
    currentImage: '/images/default.png',
    type1_name: 'bug',
    type2_name: null,
    generation: 1,
    ...overrides,
  }) as PokemonVariant;

describe('checkTermMatches', () => {
  it('matches free-text Pokemon names by leading text instead of middle substrings', () => {
    expect(checkTermMatches(makePokemon('Pikachu'), 'pi')).toBe(true);
    expect(checkTermMatches(makePokemon('Pineco'), 'pi')).toBe(true);
    expect(checkTermMatches(makePokemon('Caterpie'), 'pi')).toBe(false);
  });

  it('matches word prefixes inside multi-word species names', () => {
    expect(checkTermMatches(makePokemon('Mr. Mime'), 'mime')).toBe(true);
    expect(checkTermMatches(makePokemon('Tapu Koko'), 'ko')).toBe(true);
  });

  it('preserves structured filter matching', () => {
    expect(checkTermMatches(makePokemon('Charmander', { type1_name: 'fire' }), 'fire')).toBe(true);
    expect(checkTermMatches(makePokemon('Pikachu', { variantType: 'shiny' }), 'shiny')).toBe(true);
    expect(checkTermMatches(makePokemon('Pikachu', { generation: 1 }), 'kanto')).toBe(true);
  });

  it('uses prefix name matching inside compound search expressions', () => {
    const shinyPikachu = makePokemon('Pikachu', { variantType: 'shiny' });
    const shinyCaterpie = makePokemon('Caterpie', { variantType: 'shiny' });

    expect(matchesSearchTerm(shinyPikachu, 'pi&shiny')).toBe(true);
    expect(matchesSearchTerm(shinyCaterpie, 'pi&shiny')).toBe(false);
  });
});
