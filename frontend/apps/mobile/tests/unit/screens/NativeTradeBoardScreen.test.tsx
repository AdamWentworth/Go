import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NativeTradeBoardModel } from '../../../src/features/tradeBoard/nativeTradeBoardModel';
import { NativeTradeBoardScreen } from '../../../src/screens/NativeTradeBoardScreen';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const model: NativeTradeBoardModel = {
  boardUrl: 'https://pokegonexus.com/trade-board/Misty',
  generatedAt: '2026-08-25T00:00:00.000Z',
  includeTrade: true,
  includeWanted: true,
  pokemonGoName: 'MistyGO',
  tradeCount: 2,
  tradeEntries: [{ id: 'trade-1', imageUri: '/charizard.png', locationBackgroundUri: null, luckyRequested: false, maxKind: 'gigantamax', mostWanted: false, name: 'Gigantamax Charizard', pokedexNumber: 6, quantity: 2 }],
  username: 'Misty',
  wantedCount: 1,
  wantedEntries: [{ id: 'wanted-1', imageUri: '/blastoise.png', locationBackgroundUri: null, luckyRequested: true, maxKind: null, mostWanted: true, name: 'Shiny Blastoise', pokedexNumber: 9, quantity: 1 }],
};

const renderBoard = () => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
    <NativeTradeBoardScreen
      assetBaseUrl="https://pokegonexus.com"
      model={model}
      onActionMenuPress={jest.fn()}
      onBack={jest.fn()}
      onOpenCollection={jest.fn()}
      onRetry={jest.fn()}
    />
  </SafeAreaProvider>,
);

describe('NativeTradeBoardScreen', () => {
  it('previews both listing groups and lets either section be hidden without leaving native', () => {
    renderBoard();
    expect(screen.getByText('Trade Board')).toBeTruthy();
    expect(screen.getByText('Gigantamax Charizard')).toBeTruthy();
    expect(screen.getByText('Shiny Blastoise')).toBeTruthy();
    expect(screen.getByText('Gigantamax Charizard').props.allowFontScaling).toBe(false);
    expect(screen.getByText('Shiny Blastoise').props.allowFontScaling).toBe(false);

    fireEvent(screen.getByLabelText('Include Looking For Pokémon'), 'valueChange', false);
    expect(screen.queryByText('Shiny Blastoise')).toBeNull();
    expect(screen.getByText('Gigantamax Charizard')).toBeTruthy();
    expect(screen.getByText('Share live link')).toBeTruthy();
    expect(screen.getByText('Share board image')).toBeTruthy();
  });

  it('renders a useful empty state for a board without listings', () => {
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
        <NativeTradeBoardScreen
          assetBaseUrl="https://pokegonexus.com"
          model={{ ...model, tradeCount: 0, tradeEntries: [], wantedCount: 0, wantedEntries: [] }}
          onActionMenuPress={jest.fn()}
          onBack={jest.fn()}
          onOpenCollection={jest.fn()}
          onRetry={jest.fn()}
        />
      </SafeAreaProvider>,
    );
    expect(screen.getByText('Your Trade Board needs a listing')).toBeTruthy();
    expect(screen.getByText('Add Pokémon listings')).toBeTruthy();
  });
});
