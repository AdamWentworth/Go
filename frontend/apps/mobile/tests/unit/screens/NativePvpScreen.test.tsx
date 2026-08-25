import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BasePokemon, PokemonPvPRankingsPayload } from '@pokemongonexus/shared-contracts/pokemon';
import { NativePvpScreen } from '../../../src/screens/NativePvpScreen';

const payload = { source: null, leagues: { great: { key: 'great', label: 'Great', cpLimit: 1500, entries: [{ rank: 1, sourceRank: 1, speciesId: 'bulbasaur', name: 'Bulbasaur', pokemonId: 1, variantKind: 'pokemon', imageUrl: '/1.png', types: ['grass'], moveset: [{ id: 'vine-whip', name: 'Vine Whip', type: 'grass', kind: 'fast' }], score: 95, rating: 700, categoryScores: [91, 90, 89, 88, 87, 86], matchups: [], counters: [], moveUsage: [], recommendedLevel: 20, attackIv: 0, defenseIv: 15, staminaIv: 15 }] }, ultra: { key: 'ultra', label: 'Ultra', cpLimit: 2500, entries: [] }, master: { key: 'master', label: 'Master', cpLimit: null, entries: [] } }, formats: [] } as PokemonPvPRankingsPayload;
const catalog = [{ pokemon_id: 1, name: 'Bulbasaur', pokedex_number: 1, attack: 118, defense: 111, stamina: 128, image_url: '/1.png' }] as BasePokemon[];

describe('NativePvpScreen', () => {
  it('exposes all four PvP workspaces without a web fallback', () => {
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativePvpScreen assetBaseUrl="https://pokegonexus.com" catalog={catalog} onBack={jest.fn()} onMethodology={jest.fn()} onRetry={jest.fn()} payload={payload} signedIn={false} /></SafeAreaProvider>);
    expect(screen.getByText('PvP Rankings')).toBeTruthy();
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    fireEvent.press(screen.getByText('Team Builder'));
    expect(screen.getByText('Choose team members')).toBeTruthy();
    fireEvent.press(screen.getByText('Battle Lab'));
    expect(screen.getByText('Compare two published builds')).toBeTruthy();
    fireEvent.press(screen.getByText('IV Rank'));
    expect(screen.getByText('Rank one IV spread')).toBeTruthy();
  });
});
