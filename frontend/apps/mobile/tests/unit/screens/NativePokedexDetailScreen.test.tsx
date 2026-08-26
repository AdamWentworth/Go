import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativePokedexDetailScreen } from '../../../src/screens/NativePokedexDetailScreen';

const baseEntry = {
  id: '0001-default', pokemonId: 1, pokedexNumber: 1, name: 'Bulbasaur',
  imageUri: '/bulbasaur.png', typeIconUris: ['/images/types/grass.png', '/images/types/poison.png'], maxKind: null,
  category: 'pokemon' as const, generation: 1, instanceRegistered: false,
  manualRegistrationIds: [], registered: false, registeredFacets: [], registeredSpecies: false,
};
const entry = {
  id: '0001-shiny', pokemonId: 1, pokedexNumber: 1, name: 'Shiny Bulbasaur',
  imageUri: '/bulbasaur.png', typeIconUris: ['/images/types/grass.png', '/images/types/poison.png'], maxKind: null,
  category: 'shiny' as const, generation: 1, instanceRegistered: false,
  manualRegistrationIds: [], registered: false, registeredFacets: [], registeredSpecies: false,
};
const pokemon = {
  pokemon_id: 1, name: 'Bulbasaur', pokedex_number: 1, generation: 1,
  rarity: 'Starter', attack: 118, defense: 111, stamina: 128, cp40: 1115, cp50: 1260,
  shiny_available: 1, date_available: '2016-07-06', date_shiny_available: '2018-03-25',
  moves: [
    { move_id: 1, name: 'Vine Whip', is_fast: 1, type_name: 'Grass', pvp_power: 5, raid_power: 7, legacy: false },
    { move_id: 2, name: 'Sludge Bomb', is_fast: 0, type_name: 'Poison', pvp_power: 80, raid_power: 80, legacy: false },
  ],
  costumes: [], megaEvolutions: [], max: [], evolves_from: [], evolves_to: [2],
} as never;

describe('NativePokedexDetailScreen', () => {
  it('preserves registered, info, battle, and exact-combination workflows', () => {
    const onToggleRegistration = jest.fn();
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativePokedexDetailScreen allEntries={[baseEntry, entry]} assetBaseUrl="https://pokegonexus.com" entry={entry} onBack={jest.fn()} onOpenEntry={jest.fn()} onSetRegistrations={jest.fn()} onToggleRegistration={onToggleRegistration} pokemon={pokemon} signedIn /></SafeAreaProvider>);

    expect(screen.getByText('Register all')).toBeTruthy();
    expect(screen.getByText('Unregister all')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Register Shiny'));
    expect(onToggleRegistration).toHaveBeenCalledWith(expect.objectContaining({ entryId: '0001-shiny', registrationId: '0001-shiny' }), true);

    fireEvent.press(screen.getByText('Info'));
    expect(screen.getByText('1,115')).toBeTruthy();
    fireEvent.press(screen.getByText('Battle'));
    expect(screen.getByText('Vine Whip')).toBeTruthy();
    expect(screen.getByText('Sludge Bomb')).toBeTruthy();
    fireEvent.press(screen.getByText('More'));
    expect(screen.getByText('Variant combinations')).toBeTruthy();
    expect(screen.getByText('Showing 60 of 60')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Filter Lucky'));
    expect(screen.getByText('Showing 30 of 60')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Register Lucky'));
    expect(onToggleRegistration).toHaveBeenLastCalledWith(expect.objectContaining({ registrationId: '0001-default|lucky:true' }), true);
  });

  it('does not let a manual toggle remove a quality proved by a caught instance', () => {
    const onToggleRegistration = jest.fn();
    const collectedEntry = { ...entry, instanceRegistered: true, registered: true, registeredFacets: [{ lucky: true as const }] };
    render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}><NativePokedexDetailScreen allEntries={[baseEntry, collectedEntry]} assetBaseUrl="https://pokegonexus.com" entry={collectedEntry} onBack={jest.fn()} onOpenEntry={jest.fn()} onSetRegistrations={jest.fn()} onToggleRegistration={onToggleRegistration} pokemon={pokemon} signedIn /></SafeAreaProvider>);

    fireEvent.press(screen.getByText('More'));
    fireEvent.press(screen.getByLabelText('Open combination group Shiny Bulbasaur'));
    fireEvent.press(screen.getByLabelText('Filter Lucky'));
    expect(screen.getByText('In collection')).toBeTruthy();
    const lockedCombination = screen.UNSAFE_getAllByProps({ accessibilityLabel: 'Unregister Shiny Lucky' })[0];
    expect(lockedCombination?.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(onToggleRegistration).not.toHaveBeenCalled();
  });
});
