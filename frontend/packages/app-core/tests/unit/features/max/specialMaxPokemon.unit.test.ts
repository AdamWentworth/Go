import { describe, expect, it } from 'vitest';

import {
  canonicalSpecialMaxPokemonId,
  getSpecialMaxAttacker,
  isSpecialMaxMoveEligible,
} from '@/features/max/specialMaxPokemon';
import type { PokemonVariant } from '@/types/pokemonVariants';

const variant = (
  pokemonId: number,
  variantType: PokemonVariant['variantType'],
  form: string | null,
): PokemonVariant =>
  ({
    pokemon_id: pokemonId,
    variant_id: `${pokemonId}-${variantType}`,
    variantType,
    form,
  }) as PokemonVariant;

describe('specialMaxPokemon', () => {
  it('canonicalizes legacy crowned catalog ids', () => {
    expect(canonicalSpecialMaxPokemonId(2290)).toBe(888);
    expect(canonicalSpecialMaxPokemonId(2292)).toBe(889);
    expect(canonicalSpecialMaxPokemonId(890)).toBe(890);
  });

  it('allows only the crowned Zacian and Zamazenta forms', () => {
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 888,
        variantType: 'default',
        isCrowned: true,
      }),
    ).toBe(true);
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 2292,
        variantType: 'shiny',
        form: 'Crowned Shield',
      }),
    ).toBe(true);
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 888,
        variantType: 'default',
        form: 'Hero of Many Battles',
      }),
    ).toBe(false);
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 889,
        variantType: 'default',
      }),
    ).toBe(false);
  });

  it('allows default and shiny Eternatus without a crown or ordinary Max variant', () => {
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 890,
        variantType: 'default',
      }),
    ).toBe(true);
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 890,
        variantType: 'shiny',
      }),
    ).toBe(true);
    expect(
      isSpecialMaxMoveEligible({
        pokemonId: 890,
        variantType: 'shadow',
      }),
    ).toBe(false);
  });

  it('keeps Max Battle projections aligned with editor eligibility', () => {
    expect(
      getSpecialMaxAttacker(variant(888, 'default', 'crowned-sword')),
    ).toMatchObject({
      displayName: 'Crowned Sword Zacian',
      moveName: 'Behemoth Blade',
    });
    expect(getSpecialMaxAttacker(variant(888, 'default', null))).toBeNull();
    expect(getSpecialMaxAttacker(variant(890, 'default', null))).toMatchObject({
      displayName: 'Eternatus',
      moveName: 'Dynamax Cannon',
    });
  });
});
