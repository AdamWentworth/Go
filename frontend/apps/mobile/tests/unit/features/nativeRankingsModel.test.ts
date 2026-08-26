import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import { buildNativeRankingRows } from '../../../src/features/tools/nativeRankingsModel';

const catalog = [{ id: '0001-shiny', pokemonId: 1, pokedexNumber: 1, name: 'Shiny Bulbasaur', imageUri: '/bulbasaur.png', typeIconUris: [] as string[], maxKind: null }];
const payload = { privacy_threshold: 3, snapshot: { collector_users: 5, wishlist_users: 4, updated_at: '2026-01-01' }, most_wanted: [{ variant_id: '0001-shiny', wanted_users: 4, most_wanted_users: 2, caught_users: 3 }], rarest: [{ variant_id: '0001-shiny', wanted_users: 4, most_wanted_users: 2, caught_users: 3 }] };
describe('native rankings model', () => {
  it('joins rankings to catalog entries and applies personal filters', () => {
    const instance = { variant_id: '0001-shiny', is_caught: true, is_for_trade: true, is_wanted: false } as PokemonInstance;
    expect(buildNativeRankingRows({ catalog: [...catalog], instances: { one: instance }, mode: 'wanted', payload, collectionFilter: 'trade' })).toMatchObject([{ rank: 1, personal: { registered: true, tradeCount: 1 } }]);
    expect(buildNativeRankingRows({ catalog: [...catalog], instances: { one: instance }, mode: 'wanted', payload, collectionFilter: 'missing' })).toEqual([]);
  });
  it('filters category and search without changing canonical rank', () => {
    expect(buildNativeRankingRows({ catalog: [...catalog], mode: 'rarest', payload, category: 'shiny', query: 'bulba' })[0]?.rank).toBe(1);
    expect(buildNativeRankingRows({ catalog: [...catalog], mode: 'rarest', payload, category: 'max' })).toEqual([]);
  });
  it('collapses ordinary evolution families in rarity rankings while preserving collectibles', () => {
    const familyCatalog = [
      { ...catalog[0], evolvesFrom: [], evolvesTo: [2] },
      { ...catalog[0], id: '0002-shiny', pokemonId: 2, pokedexNumber: 2, name: 'Shiny Ivysaur', evolvesFrom: [1], evolvesTo: [] },
      { ...catalog[0], id: '0001-party_hat_shiny', name: 'Shiny Party Hat Bulbasaur', evolvesFrom: [], evolvesTo: [2] },
    ];
    const familyPayload = {
      ...payload,
      rarest: [
        { variant_id: '0002-shiny', wanted_users: 1, most_wanted_users: 1, caught_users: 1 },
        { variant_id: '0001-shiny', wanted_users: 2, most_wanted_users: 2, caught_users: 2 },
        { variant_id: '0001-party_hat_shiny', wanted_users: 3, most_wanted_users: 3, caught_users: 3 },
      ],
    };
    expect(buildNativeRankingRows({ catalog: familyCatalog, mode: 'rarest', payload: familyPayload }))
      .toMatchObject([
        { entry: { id: '0001-shiny' }, rank: 1 },
        { entry: { id: '0001-party_hat_shiny' }, rank: 2 },
      ]);
  });
});
