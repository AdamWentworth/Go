import { describe, expect, it } from 'vitest';
import { usersContract } from '@shared-contracts/users';
import { searchContract } from '@shared-contracts/search';

describe('shared contracts', () => {
  it('builds users endpoints with canonical lowercase username', () => {
    const path = usersContract.endpoints.instancesByUsername('ChernoB8ta');
    expect(path).toBe('/instances/by-username/chernob8ta');
  });

  it('encodes query values for trainer autocomplete', () => {
    const path = usersContract.endpoints.autocompleteTrainers('ash k');
    expect(path).toBe('/autocomplete-trainers?q=ash%20k');
  });

  it('exposes stable search endpoint path', () => {
    expect(searchContract.endpoints.searchPokemon).toBe('/searchPokemon');
  });
});
