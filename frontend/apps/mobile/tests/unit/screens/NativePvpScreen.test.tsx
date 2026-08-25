import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type {
  BasePokemon,
  PokemonPvPRankingEntry,
  PokemonPvPRankingsPayload,
} from '@pokemongonexus/shared-contracts/pokemon';
import { NativePvpScreen } from '../../../src/screens/NativePvpScreen';

const buff = { attackerAttack: 0, attackerDefense: 0, targetAttack: 0, targetDefense: 0, chance: 0 };
const entry = (id: string, name: string, pokemonId: number, attack: number): PokemonPvPRankingEntry => ({
  rank: pokemonId,
  sourceRank: pokemonId,
  speciesId: id,
  name,
  pokemonId,
  variantKind: 'pokemon',
  imageUrl: `/${pokemonId}.png`,
  types: ['grass'],
  moveset: [
    { id: `${id}-fast`, name: 'Vine Whip', type: 'grass', kind: 'fast', power: 5, energyGain: 8, energyCost: 0, turns: 2, buff },
    { id: `${id}-charged`, name: 'Power Whip', type: 'grass', kind: 'charged', power: 90, energyGain: 0, energyCost: 50, turns: 1, buff },
  ],
  score: 95 - pokemonId,
  rating: 700 - pokemonId,
  categoryScores: [91, 90, 89, 88, 87, 86],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 20,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
  battleAttack: attack,
  battleDefense: 120,
  battleHp: 125,
});

const bulbasaur = entry('bulbasaur', 'Bulbasaur', 1, 121);
const ivysaur = entry('ivysaur', 'Ivysaur', 2, 119);
const payload = {
  source: null,
  leagues: {
    great: { key: 'great', label: 'Great', cpLimit: 1500, entries: [bulbasaur, ivysaur] },
    ultra: { key: 'ultra', label: 'Ultra', cpLimit: 2500, entries: [] },
    master: { key: 'master', label: 'Master', cpLimit: null, entries: [] },
  },
  formats: [],
} as PokemonPvPRankingsPayload;
const catalog = [
  { pokemon_id: 1, name: 'Bulbasaur', pokedex_number: 1, attack: 118, defense: 111, stamina: 128, image_url: '/1.png' },
] as BasePokemon[];

const renderScreen = () => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
    <NativePvpScreen assetBaseUrl="https://pokegonexus.com" catalog={catalog} onBack={jest.fn()} onMethodology={jest.fn()} onRetry={jest.fn()} payload={payload} signedIn={false} />
  </SafeAreaProvider>,
);

describe('NativePvpScreen', () => {
  it('exposes all four PvP workspaces without a web fallback', () => {
    renderScreen();
    expect(screen.getByText('PvP Rankings')).toBeTruthy();
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    fireEvent.press(screen.getByText('Team Builder'));
    expect(screen.getByText('Choose team members')).toBeTruthy();
    fireEvent.press(screen.getByText('Battle Lab'));
    expect(screen.getByText('Simulate a focused matchup')).toBeTruthy();
    expect(screen.queryByText(/web simulator/i)).toBeNull();
    fireEvent.press(screen.getByText('IV Rank'));
    expect(screen.getByText('Rank one IV spread')).toBeTruthy();
  });

  it('runs the shared battle mechanics and renders a canonical result', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Battle Lab'));
    fireEvent.press(screen.getByLabelText('Simulate battle'));
    expect(screen.getByText('SIMULATED RESULT')).toBeTruthy();
    expect(screen.getByText(/wins|draw/i)).toBeTruthy();
    expect(screen.getAllByText(/rating/)).toHaveLength(2);
  });
});
