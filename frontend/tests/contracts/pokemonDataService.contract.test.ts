import { beforeAll, describe, expect, it, vi } from 'vitest';

import { getPokemons } from '@/services/pokemonDataService';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonFixtures from '../__helpers__/fixtures/pokemons.json' assert { type: 'json' };

const requiredKeys: (keyof BasePokemon)[] = [
  'pokemon_id',
  'name',
  'pokedex_number',
  'attack',
  'defense',
  'stamina',
  'type_1_id',
  'type_2_id',
  'gender_rate',
  'rarity',
  'form',
  'generation',
  'available',
  'shiny_available',
  'shiny_rarity',
  'date_available',
  'date_shiny_available',
  'female_unique',
  'type1_name',
  'type2_name',
  'shadow_shiny_available',
  'shadow_apex',
  'date_shadow_available',
  'date_shiny_shadow_available',
  'shiny_shadow_rarity',
  'image_url',
  'image_url_shadow',
  'image_url_shiny',
  'image_url_shiny_shadow',
  'type_1_icon',
  'type_2_icon',
  'costumes',
  'moves',
  'fusion',
  'cp40',
  'cp50',
  'sprite_url',
  'backgrounds',
  'megaEvolutions',
  'raid_boss',
  'max',
];

const optionalKeys: (keyof BasePokemon)[] = [
  'evolves_from',
  'evolves_to',
  'female_data',
  'sizes',
];

describe('pokemonDataService contract', () => {
  let apiResponse: BasePokemon[];

  beforeAll(async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(pokemonFixtures), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    apiResponse = await getPokemons();
  });

  it('returns non-empty array', () => {
    expect(Array.isArray(apiResponse)).toBe(true);
    expect(apiResponse.length).toBeGreaterThan(0);
  });

  it('contains all required keys and no unknown keys on sample', () => {
    const sample = apiResponse[0];
    const sampleKeys = Object.keys(sample);

    const missingRequired = requiredKeys.filter((key) => !sampleKeys.includes(key));
    expect(missingRequired).toEqual([]);

    const allValidKeys = [...requiredKeys, ...optionalKeys];
    const unexpectedKeys = sampleKeys.filter(
      (key) => !allValidKeys.includes(key as keyof BasePokemon),
    );
    expect(unexpectedKeys).toEqual([]);
  });

  it('enforces expected field constraints on sample', () => {
    const sample = apiResponse[0];

    [
      'pokemon_id',
      'pokedex_number',
      'attack',
      'defense',
      'stamina',
      'type_1_id',
      'type_2_id',
    ].forEach((field) => {
      const value = sample[field as keyof BasePokemon];
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });

    expect(sample.gender_rate).toMatch(/^(([MF]\/[MF])|(\d+M_\d+F(_\d+GL)?))$/);

    const validRarities = ['common', 'rare', 'legendary', 'mythical', 'standard'];
    expect(validRarities).toContain(sample.rarity.toLowerCase());
  });

  it('keeps evolution/type relationships consistent across a sample set', () => {
    const samples = apiResponse.slice(0, Math.min(apiResponse.length, 10));

    samples.forEach((pokemon) => {
      const missingFields = requiredKeys.filter((key) => !(key in pokemon));
      expect(missingFields).toEqual([]);

      if (pokemon.evolves_from) {
        const preEvolution = apiResponse.find(
          (candidate) => candidate.pokemon_id === Number(pokemon.evolves_from),
        );
        expect(preEvolution).toBeDefined();
      }

      const sameType = apiResponse.find((candidate) => candidate.type_1_id === pokemon.type_1_id);
      expect(sameType?.type1_name.toLowerCase()).toBe(pokemon.type1_name.toLowerCase());
    });
  });
});
