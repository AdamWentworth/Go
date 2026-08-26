import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import { NativeRaidScreen } from '../../../src/screens/NativeRaidScreen';
const fast = { move_id: 1, name: 'Vine Whip', raid_power: 10, raid_energy: 8, raid_cooldown: 1, is_fast: 1, type_name: 'grass', type: 'grass' } as Move;
const charged = { ...fast, move_id: 2, name: 'Power Whip', raid_power: 90, raid_energy: -50, raid_cooldown: 2.5, is_fast: 0 } as Move;
const catalog = [{ pokemon_id: 1, name: 'Bulbasaur', pokedex_number: 1, attack: 118, defense: 111, stamina: 128, available: 1, cp40: 1000, cp50: 1200, type1_name: 'grass', type2_name: 'poison', image_url: '/1.png', moves: [fast, charged], raid_boss: [{ id: 1, pokemon_id: 1, name: 'Bulbasaur', form: 'Normal', type: 'one-star', boosted_weather: '', max_boosted_cp: 500, max_unboosted_cp: 400, min_boosted_cp: 300, min_unboosted_cp: 200, possible_shiny: 1, tier: 'one-star' }] }] as BasePokemon[];
const renderRaid = (props: Partial<React.ComponentProps<typeof NativeRaidScreen>> = {}) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
    <NativeRaidScreen assetBaseUrl="https://pokegonexus.com" catalog={catalog} onBack={jest.fn()} onMethodology={jest.fn()} onOpenPokemon={jest.fn()} onRetry={jest.fn()} signedIn={false} {...props} />
  </SafeAreaProvider>,
);

describe('NativeRaidScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });
  it('switches to exact boss counters and opens methodology', () => {
    const onMethodology = jest.fn();
    renderRaid({ onMethodology });
    expect(screen.getByText('Raid Planner')).toBeTruthy();
    fireEvent.press(screen.getByText('Boss counters'));
    expect(screen.getByText('RAID BOSS')).toBeTruthy();
    expect(screen.getByLabelText('Find boss')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('How raid rankings work'));
    expect(onMethodology).toHaveBeenCalled();
  });
  it('supports type filters, all movesets, settings, and expanded metrics', () => {
    renderRaid();
    fireEvent.press(screen.getByLabelText('Grass'));
    expect(screen.getByText('Top Grass attackers')).toBeTruthy();
    fireEvent.press(screen.getByText('ALL MOVESETS'));
    expect(screen.getByText('ALL MOVESETS')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Ranking settings'));
    expect(screen.getByText('Ranking conditions')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Show all raid stats for Bulbasaur'));
    expect(screen.getByText('TDO')).toBeTruthy();
    expect(screen.getByText('ER')).toBeTruthy();
  });
  it('expands boss setup and simulates a custom raid party', () => {
    renderRaid();
    fireEvent.press(screen.getByText('Boss counters'));
    fireEvent.press(screen.getByLabelText('Raid setup'));
    expect(screen.getByText('BOSS HP')).toBeTruthy();
    expect(screen.getByText('COMFORTABLE')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Custom raid party'));
    expect(screen.getByLabelText('Suggested raid team')).toBeTruthy();
    fireEvent.press(screen.getByText('⚡ Simulate lobby'));
    expect(screen.getByText('Likely clear')).toBeTruthy();
  });
});
