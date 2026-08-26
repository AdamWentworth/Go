import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativePokedexScreen } from '../../../src/screens/NativePokedexScreen';

const entry = { id: '0001-shiny', pokemonId: 1, pokedexNumber: 1, name: 'Shiny Bulbasaur', imageUri: '/bulbasaur.png', typeIconUris: [], maxKind: null, category: 'shiny' as const, generation: 1, instanceRegistered: true, manualRegistrationIds: [], registered: true, registeredFacets: [{}], registeredSpecies: true };

describe('NativePokedexScreen', () => {
  it('supports region, category, and query filtering and opens an exact entry', () => {
    const onOpenEntry = jest.fn();
    const onSetRegistrations = jest.fn();
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativePokedexScreen assetBaseUrl="https://pokegonexus.com" entries={[entry]} onBack={jest.fn()} onOpenEntry={onOpenEntry} onRetry={jest.fn()} onSetRegistrations={onSetRegistrations} /></SafeAreaProvider>);
    expect(screen.getByText('Pokédex')).toBeTruthy();
    fireEvent.press(screen.getByText('Shiny'));
    expect(screen.getByLabelText('Advanced Pokédex filters')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Open Kanto'));
    fireEvent.changeText(screen.getByLabelText('Search Pokédex'), 'bulba');
    fireEvent.press(screen.getByText('Register all'));
    expect(screen.getByText('Register every visible entry?')).toBeTruthy();
    fireEvent.press(screen.getAllByText('Register all')[1]);
    expect(onSetRegistrations).toHaveBeenCalledWith([
      expect.objectContaining({ entryId: entry.id, registrationId: entry.id }),
    ], true);
    fireEvent.press(screen.getByLabelText('Open Shiny Bulbasaur'));
    expect(onOpenEntry).toHaveBeenCalledWith(entry);
  });
});
