import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeRankingsScreen } from '../../../src/screens/NativeRankingsScreen';
const row = { caughtUsers: 3, entry: { id: '0001-shiny', pokemonId: 1, pokedexNumber: 1, name: 'Shiny Bulbasaur', imageUri: '/1.png', typeIconUris: [], maxKind: null }, mostWantedUsers: 2, personal: { caughtCount: 1, registered: true, tradeCount: 0, wanted: true }, rank: 1, wantedUsers: 4 };
describe('NativeRankingsScreen', () => {
  it('changes ranking controls and opens exact Pokémon', () => {
    const onChangeMode = jest.fn(); const onOpenEntry = jest.fn();
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativeRankingsScreen assetBaseUrl="https://pokegonexus.com" collectorCount={5} onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeCollectionFilter={jest.fn()} onChangeMode={onChangeMode} onChangeQuery={jest.fn()} onOpenEntry={onOpenEntry} onRetry={jest.fn()} privacyThreshold={3} rows={[row]} selectedCategory="all" selectedCollectionFilter="all" selectedMode="wanted" showCollectionFilters snapshotLabel="Recently updated" /></SafeAreaProvider>);
    expect(screen.getByText('Community Rankings')).toBeTruthy(); fireEvent.press(screen.getByText('◆ Rarest owned')); expect(onChangeMode).toHaveBeenCalledWith('rarest'); fireEvent.press(screen.getByLabelText('Open rank 1, Shiny Bulbasaur')); expect(onOpenEntry).toHaveBeenCalledWith(row);
  });
});
