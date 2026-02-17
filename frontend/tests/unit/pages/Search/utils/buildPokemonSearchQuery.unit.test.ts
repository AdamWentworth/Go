import { describe, expect, it } from 'vitest';

import {
  buildPokemonSearchQueryParams,
  findMatchingPokemonVariant,
  validateSearchInput,
} from '@/pages/Search/utils/buildPokemonSearchQuery';
import type { PokemonVariant } from '@/types/pokemonVariants';

const pokemonCache = [
  {
    pokemon_id: 1,
    name: 'Bulbasaur',
    form: null,
    costumes: [{ name: 'Party', costume_id: 7 }],
  },
  {
    pokemon_id: 25,
    name: 'Pikachu',
    form: 'Rockstar',
    costumes: [{ name: 'Rockstar', costume_id: 25 }],
  },
] as unknown as PokemonVariant[];

describe('buildPokemonSearchQuery utils', () => {
  it('validates blocking shadow+trade/wanted constraints', () => {
    const error = validateSearchInput({
      isShadow: true,
      ownershipMode: 'trade',
      pokemon: 'Bulbasaur',
      useCurrentLocation: false,
      city: 'Seattle',
      coordinates: { latitude: 47.6, longitude: -122.3 },
      pokemonCache,
    });

    expect(error).toBe('Shadow Pokemon cannot be listed for trade or wanted');
  });

  it('matches pokemon by name and optional form', () => {
    expect(findMatchingPokemonVariant(pokemonCache, 'bulbasaur', '')?.pokemon_id).toBe(1);
    expect(findMatchingPokemonVariant(pokemonCache, 'pikachu', 'rockstar')?.pokemon_id).toBe(25);
    expect(findMatchingPokemonVariant(pokemonCache, 'pikachu', 'libre')).toBeUndefined();
  });

  it('builds trade query with caught and wanted fields normalized out', () => {
    const query = buildPokemonSearchQueryParams({
      matchingPokemon: pokemonCache[0],
      costume: 'Party',
      isShiny: false,
      isShadow: false,
      selectedMoves: { fastMove: 1, chargedMove1: 2, chargedMove2: 3 },
      selectedGender: 'Female',
      selectedBackgroundId: 42,
      ivs: { Attack: 15, Defense: 14, Stamina: 13 },
      onlyMatchingTrades: true,
      prefLucky: true,
      friendshipLevel: 4,
      alreadyRegistered: true,
      tradeInWantedList: true,
      coordinates: { latitude: 47.6, longitude: -122.3 },
      ownershipMode: 'trade',
      range: 5,
      resultsLimit: 10,
      dynamax: false,
      gigantamax: false,
    });

    expect(query).toMatchObject({
      ownership: 'trade',
      costume_id: 7,
      only_matching_trades: true,
      attack_iv: null,
      defense_iv: null,
      stamina_iv: null,
      pref_lucky: null,
      friendship_level: null,
      already_registered: null,
      trade_in_wanted_list: null,
    });
  });

  it('builds wanted query with trade-only fields normalized out', () => {
    const query = buildPokemonSearchQueryParams({
      matchingPokemon: pokemonCache[0],
      costume: '',
      isShiny: false,
      isShadow: false,
      selectedMoves: { fastMove: null, chargedMove1: null, chargedMove2: null },
      selectedGender: 'Any',
      selectedBackgroundId: null,
      ivs: { Attack: 15, Defense: 14, Stamina: 13 },
      onlyMatchingTrades: true,
      prefLucky: true,
      friendshipLevel: 4,
      alreadyRegistered: true,
      tradeInWantedList: true,
      coordinates: { latitude: 47.6, longitude: -122.3 },
      ownershipMode: 'wanted',
      range: 5,
      resultsLimit: 10,
      dynamax: false,
      gigantamax: false,
    });

    expect(query).toMatchObject({
      ownership: 'wanted',
      only_matching_trades: null,
      attack_iv: null,
      defense_iv: null,
      stamina_iv: null,
      pref_lucky: true,
      friendship_level: 4,
      already_registered: true,
      trade_in_wanted_list: true,
    });
  });
});

