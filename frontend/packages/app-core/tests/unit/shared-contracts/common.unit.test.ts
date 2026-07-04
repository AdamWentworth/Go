import { describe, expect, it } from 'vitest';
import { buildUrl } from '@shared-contracts/common';

describe('shared common contract helpers', () => {
  it('builds absolute URLs with normalized slashes', () => {
    const url = buildUrl('https://pokegonexus.com/api/users', '/overview');
    expect(url).toBe('https://pokegonexus.com/api/users/overview');
  });

  it('serializes query params and skips nullish values', () => {
    const url = buildUrl('https://pokegonexus.com/api/search', '/searchPokemon', {
      pokemon_id: 25,
      shiny: true,
      costume_id: null,
      range_km: undefined,
      ownership: 'caught',
    });

    expect(url).toBe(
      'https://pokegonexus.com/api/search/searchPokemon?pokemon_id=25&shiny=true&ownership=caught',
    );
  });

  it('resolves same-origin base URLs against the browser origin', () => {
    const url = buildUrl('/api/pokemon', '/pokemons');

    expect(url).toBe('http://localhost:3000/api/pokemon/pokemons');
  });
});
