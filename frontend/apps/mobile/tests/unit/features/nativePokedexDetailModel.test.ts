import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  buildNativePokedexCombinationSections,
  buildNativePokedexRegistrationSlots,
  filterNativePokedexCombinations,
  toggleNativePokedexComboFilter,
} from '../../../src/features/tools/nativePokedexDetailModel';
import type { NativePokedexEntry } from '../../../src/features/tools/nativePokedexModel';

const entry = (overrides: Partial<NativePokedexEntry>): NativePokedexEntry => ({
  id: '0001-default', pokemonId: 1, pokedexNumber: 1, name: 'Bulbasaur', imageUri: '/bulbasaur.png',
  typeIconUris: [], maxKind: null, category: 'pokemon', generation: 1, instanceRegistered: false,
  manualRegistrationIds: [], registered: false, registeredFacets: [], released: true, registeredSpecies: false,
  ...overrides,
});
const pokemon = { pokemon_id: 1, gender_rate: 'M/F' } as BasePokemon;

describe('native Pokédex detail model', () => {
  it('builds the canonical primary, form, and purified registration slots', () => {
    const slots = buildNativePokedexRegistrationSlots([
      entry({}),
      entry({ id: '0001-shiny', name: 'Shiny Bulbasaur', category: 'shiny' }),
      entry({ id: '0001-shadow', name: 'Shadow Bulbasaur', category: 'shadow' }),
    ], 1);

    expect(slots.map(({ label }) => label)).toEqual(expect.arrayContaining([
      'Pokémon', 'Shiny', '100%', 'Lucky', 'XXL', 'XXS', 'Shadow Bulbasaur', 'Purified',
    ]));
    expect(slots.find(({ label }) => label === 'Lucky')?.registration.registrationId).toBe('0001-default|lucky:true');
  });

  it('creates exact variant combinations and locks collection-derived combinations', () => {
    const luckyId = '0001-default|lucky:true';
    const sections = buildNativePokedexCombinationSections([
      entry({ instanceRegistered: true, registered: true, registeredFacets: [{ lucky: true }] }),
      entry({ id: '0001-shiny', name: 'Shiny Bulbasaur', category: 'shiny', manualRegistrationIds: [luckyId] }),
    ], pokemon);
    const baseCombos = sections.find(({ id }) => id === '0001-default')?.combinations ?? [];
    const lucky = baseCombos.find(({ facets }) => facets.lucky && !facets.gender && !facets.size && !facets.appraisal);

    expect(baseCombos).toHaveLength(60);
    expect(lucky).toMatchObject({ registered: true, lockedByInstance: true });
  });

  it('filters within exclusive groups while allowing multiple required quality filters', () => {
    const combinations = buildNativePokedexCombinationSections([entry({})], pokemon)[0]?.combinations ?? [];
    const filters = toggleNativePokedexComboFilter(
      toggleNativePokedexComboFilter([], 'lucky'),
      'perfect',
    );
    const filtered = filterNativePokedexCombinations(combinations, 'female', filters);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(({ facets }) => facets.gender === 'Female' && facets.lucky && facets.appraisal === '4-star')).toBe(true);
    expect(toggleNativePokedexComboFilter(['male'], 'female')).toEqual(['female']);
  });
});
