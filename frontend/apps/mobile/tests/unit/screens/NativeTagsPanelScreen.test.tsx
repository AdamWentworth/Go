import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeTagsPanelScreen } from '../../../src/screens/NativeTagsPanelScreen';

const tag = {
  key: 'custom:purple-tag' as const,
  parent: 'caught' as const,
  name: 'Shadow Shinies',
  color: '#7c3aed',
  tone: 'custom' as const,
  rows: [{
    id: 'instance-1',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Shiny Shadow Charizard',
    imageUri: 'https://pokegonexus.com/images/charizard.png',
    locationBackgroundUri: null,
    maxKind: null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'caught' as const,
    source: 'instance' as const,
    cp: 2500,
    favorite: false,
    mostWanted: false,
  }],
};

describe('NativeTagsPanelScreen', () => {
  it('renders real tag membership and returns the selected tag to the Pokémon grid', () => {
    const onSelectTag = jest.fn();
    const onViewChange = jest.fn();
    render(
      <NativeTagsPanelScreen
        activeTagName={null}
        assetBaseUrl="https://pokegonexus.com"
        collectionCount={2500}
        error={null}
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onRetry={jest.fn()}
        onSelectTag={onSelectTag}
        onViewChange={onViewChange}
        parent="caught"
        tags={[tag]}
      />,
    );

    expect(screen.getByText('Shadow Shinies')).toBeTruthy();
    expect(screen.getByText('1 Pokémon have this tag.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Open Shadow Shinies/i }));
    expect(onSelectTag).toHaveBeenCalledWith(tag);
    fireEvent.press(screen.getByRole('tab', { name: /wishlist/i }));
    expect(onViewChange).toHaveBeenCalledWith('wishlist');
  });
});
