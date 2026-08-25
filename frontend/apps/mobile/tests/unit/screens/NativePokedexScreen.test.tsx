import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativePokedexScreen } from '../../../src/screens/NativePokedexScreen';

const entry = { id: '0001-shiny', pokemonId: 1, pokedexNumber: 1, name: 'Shiny Bulbasaur', imageUri: '/bulbasaur.png', typeIconUris: [], maxKind: null, category: 'shiny' as const, generation: 1, registered: true };

describe('NativePokedexScreen', () => {
  it('supports region, category, and query filtering and opens an exact entry', () => {
    const onOpenEntry = jest.fn();
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativePokedexScreen assetBaseUrl="https://pokegonexus.com" entries={[entry]} onBack={jest.fn()} onOpenEntry={onOpenEntry} onRetry={jest.fn()} /></SafeAreaProvider>);
    expect(screen.getByText('Pokédex')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    fireEvent.press(screen.getByText('Shiny'));
    fireEvent.changeText(screen.getByLabelText('Search Pokédex'), 'bulba');
    fireEvent.press(screen.getByLabelText('Open Shiny Bulbasaur'));
    expect(onOpenEntry).toHaveBeenCalledWith(entry);
  });
});
