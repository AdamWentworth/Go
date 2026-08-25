import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import { buildNativeMaxRankings, buildNativeRaidAttackers, buildNativeRaidBosses, hydrateNativeToolCatalog, nativeTypeEffectiveness } from '../../../src/features/tools/nativeBattleModels';

const fast = { move_id: 1, name: 'Vine Whip', type_id: 10, raid_power: 10, pvp_power: 5, raid_energy: 8, pvp_energy: 8, raid_cooldown: 1, pvp_turns: 2, is_fast: 1, type_name: 'grass', legacy: false, type: 'grass' } as Move;
const charged = { ...fast, move_id: 2, name: 'Power Whip', raid_power: 90, raid_energy: -50, raid_cooldown: 2.5, is_fast: 0 } as Move;
const pokemon = { pokemon_id: 1, name: 'Bulbasaur', pokedex_number: 1, attack: 118, defense: 111, stamina: 128, available: 1, cp40: 1000, cp50: 1200, type1_name: 'grass', type2_name: 'poison', image_url: '/1.png', moves: [], raid_boss: [], max: [{ pokemon_id: 1, dynamax: 1, gigantamax: 0, dynamax_release_date: null, gigantamax_release_date: null }] } as unknown as BasePokemon;

describe('native battle models', () => {
  it('hydrates move and raid chunks and ranks legal attackers', () => {
    const hydrated = hydrateNativeToolCatalog([pokemon], [{ pokemon_id: 1, moves: [fast, charged], fusion: [], crownForms: [] }], [{ pokemon_id: 1, raid_boss: [{ id: 1, pokemon_id: 1, name: 'Bulbasaur', form: 'Normal', type: 'one-star', boosted_weather: '', max_boosted_cp: 500, max_unboosted_cp: 400, min_boosted_cp: 300, min_unboosted_cp: 200, possible_shiny: 1, tier: 'one-star' }] }]);
    expect(buildNativeRaidBosses(hydrated)).toHaveLength(1);
    expect(buildNativeRaidAttackers({ catalog: hydrated })[0]?.fastMove?.name).toBe('Vine Whip');
    expect(buildNativeMaxRankings({ catalog: hydrated, role: 'damage' })[0]?.maxKind).toBe('dynamax');
  });
  it('applies both defending types', () => expect(nativeTypeEffectiveness('grass', ['water', 'ground'])).toBeCloseTo(2.56));
});
