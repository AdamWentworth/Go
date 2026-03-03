import { describe, expect, it } from 'vitest';

import createPokemonVariants from '@/features/variants/utils/createPokemonVariants';
import type { BasePokemon } from '@/types/pokemonBase';
import type { PokemonVariant } from '@/types/pokemonVariants';

import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';

const samplePokemons = (pokemonsFixture as BasePokemon[]).slice(0, 40);

describe('createPokemonVariants (unit)', () => {
  it('creates at least one variant per base pokemon', () => {
    const variants = createPokemonVariants(samplePokemons);
    const defaults = variants.filter((v) => v.variantType === 'default');

    expect(defaults).toHaveLength(samplePokemons.length);
    expect(variants.length).toBeGreaterThanOrEqual(samplePokemons.length);
  });

  it('assigns non-empty and unique variant_id values', () => {
    const variants = createPokemonVariants(samplePokemons);
    const ids = variants.map((v) => v.variant_id);
    const unique = new Set(ids);

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(unique.size).toBe(ids.length);
  });

  it('assigns non-empty display names for all generated variants', () => {
    const variants = createPokemonVariants(samplePokemons);
    const names = variants.map((v) => v.name);
    expect(names.every((n) => typeof n === 'string' && n.trim().length > 0)).toBe(true);
  });

  it('generates stable variant_id sequences for same input', () => {
    const first = createPokemonVariants(samplePokemons).map((v) => v.variant_id);
    const second = createPokemonVariants(samplePokemons).map((v) => v.variant_id);

    expect(second).toEqual(first);
  });

  it('does not create shiny default variants when shiny_available is false', () => {
    const variants = createPokemonVariants(samplePokemons);
    const byId = new Map<number, PokemonVariant[]>();
    for (const v of variants) {
      byId.set(v.pokemon_id, [...(byId.get(v.pokemon_id) || []), v]);
    }

    for (const p of samplePokemons.filter((x) => !x.shiny_available)) {
      const pokemonVariants = byId.get(p.pokemon_id) || [];
      const hasShiny = pokemonVariants.some((v) => v.variantType === 'shiny');
      expect(hasShiny).toBe(false);
    }
  });

  it('includes costume variants for pokemon that have costumes', () => {
    const variants = createPokemonVariants(samplePokemons);
    const costumeEligible = samplePokemons.filter((p) => p.costumes?.length > 0);

    for (const p of costumeEligible) {
      const pokemonVariants = variants.filter((v) => v.pokemon_id === p.pokemon_id);
      const hasCostume = pokemonVariants.some((v) => v.variantType.startsWith('costume_'));
      expect(hasCostume).toBe(true);
    }
  });
});
