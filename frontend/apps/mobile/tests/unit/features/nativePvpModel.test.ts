import type { BasePokemon, PokemonPvPRankingEntry, PokemonPvPRankingsPayload } from '@pokemongonexus/shared-contracts/pokemon';
import { analyzeNativePvpTeam, buildNativePvpFormats, calculateNativePvpIvSummary, filterNativePvpEntries, pvpRoleScore } from '../../../src/features/tools/nativePvpModel';

const entry = (speciesId: string, pokemonId: number, score: number, lead: number, counter = 'lanturn'): PokemonPvPRankingEntry => ({
  rank: 1, sourceRank: 1, speciesId, name: speciesId, pokemonId, variantKind: 'pokemon', imageUrl: `/${pokemonId}.png`, types: ['water'], moveset: [{ id: 'fast', name: 'Quick Attack', type: 'normal', kind: 'fast' }], score, rating: 700, categoryScores: [lead, 1, 1, 1, 1, 1], matchups: [], counters: [{ speciesId: counter, rating: 300 }], moveUsage: [], recommendedLevel: 20, attackIv: 0, defenseIv: 15, staminaIv: 15,
});
const azumarill = entry('Azumarill', 184, 90, 98);
const clodsire = entry('Clodsire', 980, 95, 80);
const payload = { source: null, leagues: { great: { key: 'great', label: 'Great', cpLimit: 1500, entries: [azumarill, clodsire] }, ultra: { key: 'ultra', label: 'Ultra', cpLimit: 2500, entries: [] }, master: { key: 'master', label: 'Master', cpLimit: null, entries: [] } }, formats: [] } as PokemonPvPRankingsPayload;

describe('native PvP model', () => {
  it('builds formats and changes ordering with the selected role', () => {
    expect(buildNativePvpFormats(payload)[0]?.label).toBe('Great League');
    expect(filterNativePvpEntries({ entries: [azumarill, clodsire], role: 'overall' })[0]?.speciesId).toBe('Clodsire');
    expect(filterNativePvpEntries({ entries: [azumarill, clodsire], role: 'lead' })[0]?.speciesId).toBe('Azumarill');
    expect(pvpRoleScore(azumarill, 'lead')).toBe(98);
  });

  it('filters to caught species and reports shared team threats', () => {
    const instances = { caught: { pokemon_id: 184, is_caught: true, disabled: false } } as never;
    expect(filterNativePvpEntries({ entries: [azumarill, clodsire], instances, scope: 'owned' })).toEqual([azumarill]);
    expect(analyzeNativePvpTeam([azumarill, clodsire]).sharedThreats).toEqual(['lanturn']);
  });

  it('ranks a selected appraisal against all legal spreads', () => {
    const pokemon = { pokemon_id: 184, name: 'Azumarill', attack: 112, defense: 152, stamina: 225 } as BasePokemon;
    const result = calculateNativePvpIvSummary(pokemon, { attack: 0, defense: 15, stamina: 15 }, 'great');
    expect(result.total).toBe(4096);
    expect(result.cp).toBeLessThanOrEqual(1500);
    expect(result.rank).toBeGreaterThanOrEqual(1);
    expect(result.statProductPercent).toBeLessThanOrEqual(100);
    expect(result.best.rank).toBe(1);
    expect(result.nearby.some((spread) => spread.rank === result.rank)).toBe(true);
  });

  it('uses level 50 by default and only reaches level 51 for Best Buddy', () => {
    const pokemon = { pokemon_id: 1, name: 'Bulbasaur', attack: 118, defense: 111, stamina: 128 } as BasePokemon;
    expect(calculateNativePvpIvSummary(pokemon, { attack: 0, defense: 15, stamina: 15 }, 'master').level).toBe(50);
    expect(calculateNativePvpIvSummary(pokemon, { attack: 0, defense: 15, stamina: 15 }, 'master', 51).level).toBe(51);
  });
});
