import { describe, expect, it } from 'vitest';

import getPokemonDisplayName from '@/pages/Search/utils/getPokemonDisplayName';

describe('getPokemonDisplayName', () => {
  it('builds shiny+shadow+form+costume display names', () => {
    const result = getPokemonDisplayName({
      shiny: true,
      shadow: true,
      costume_id: 3,
      pokemonInfo: {
        name: 'pikachu',
        form: 'alolan',
        costumes: [
          { costume_id: 1, name: 'flower_crown' },
          { costume_id: 3, name: 'party_hat' },
        ],
      },
    });

    expect(result).toBe('Shiny Shadow Alolan Party Hat Pikachu');
  });

  it('omits costume text when costume id has no matching entry', () => {
    const result = getPokemonDisplayName({
      shiny: true,
      shadow: false,
      costume_id: 99,
      pokemonInfo: {
        name: 'charizard',
        form: 'mega_x',
        costumes: [{ costume_id: 1, name: 'party_hat' }],
      },
    });

    expect(result).toBe('Shiny Mega X Charizard');
  });

  it('returns normalized base name when no modifiers are present', () => {
    const result = getPokemonDisplayName({
      pokemonInfo: {
        name: 'BULBASAUR',
        form: null,
        costumes: [],
      },
    });

    expect(result).toBe('Bulbasaur');
  });
});
