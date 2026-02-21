import { describe, expect, it } from 'vitest';
import { buildUrl } from '@shared-contracts/common';

describe('shared common contract helpers', () => {
  it('builds absolute URLs with normalized slashes', () => {
    const url = buildUrl('https://pokemongonexus.com/api/users', '/overview');
    expect(url).toBe('https://pokemongonexus.com/api/users/overview');
  });

  it('serializes query params and skips nullish values', () => {
    const url = buildUrl('https://pokemongonexus.com/api/search', '/searchPokemon', {
      pokemon_id: 25,
      shiny: true,
      costume_id: null,
      range_km: undefined,
      ownership: 'caught',
    });

    expect(url).toBe(
      'https://pokemongonexus.com/api/search/searchPokemon?pokemon_id=25&shiny=true&ownership=caught',
    );
  });
});
