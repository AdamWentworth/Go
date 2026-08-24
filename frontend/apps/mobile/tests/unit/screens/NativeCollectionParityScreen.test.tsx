import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeCollectionRow } from '../../../src/features/collection/collectionModel';
import { NativeCollectionParityScreen } from '../../../src/screens/NativeCollectionParityScreen';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

const row = (patch: Partial<NativeCollectionRow>): NativeCollectionRow => ({
  id: 'instance-1',
  pokemonId: 1,
  pokedexNumber: 1,
  name: 'Bulbasaur',
  imageUri: 'https://pokegonexus.com/images/pokemon_1.png',
  locationBackgroundUri: null,
  maxKind: null,
  purified: false,
  lucky: false,
  typeIconUris: ['https://pokegonexus.com/images/types/grass.png'],
  status: 'caught',
  cp: 500,
  favorite: true,
  mostWanted: false,
  ...patch,
});

const rows = [
  row({ id: 'bulbasaur', name: 'Bulbasaur', favorite: true }),
  row({
    id: 'charizard',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Charizard',
    favorite: false,
    status: 'trade',
  }),
];

const Harness = ({
  onOpenCanonicalCollection = jest.fn(),
  onOpenInstance = jest.fn(),
}: {
  onOpenCanonicalCollection?: jest.Mock;
  onOpenInstance?: jest.Mock;
}) => {
  const [query, setQuery] = useState('');
  return (
    <NativeCollectionParityScreen
      assetBaseUrl="https://pokegonexus.com"
      rows={rows}
      query={query}
      isLoading={false}
      error={null}
      onQueryChange={setQuery}
      onRetry={jest.fn()}
      onOpenInstance={onOpenInstance}
      onOpenCanonicalCollection={onOpenCanonicalCollection}
    />
  );
};

describe('NativeCollectionParityScreen', () => {
  it('starts in the canonical Favorites context and can return to the full real collection', () => {
    render(<Harness />);

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.queryByText('Charizard')).toBeNull();
    fireEvent.press(screen.getByLabelText('Clear Favorites tag filter'));
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Charizard')).toBeTruthy();
  });

  it('searches the connected rows and opens a real instance', () => {
    const onOpenInstance = jest.fn();
    render(<Harness onOpenInstance={onOpenInstance} />);

    fireEvent.press(screen.getByLabelText('Clear Favorites tag filter'));
    fireEvent.changeText(screen.getByLabelText('Search'), 'char');
    expect(screen.queryByText('Bulbasaur')).toBeNull();
    expect(screen.getByText('Charizard')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'View Charizard' }));
    expect(onOpenInstance).toHaveBeenCalledWith('charizard');
  });

  it('lets the user choose an actual sort and direction', () => {
    render(<Harness />);

    fireEvent.press(screen.getByLabelText('Sort by Pokédex number ascending'));
    fireEvent.press(screen.getByRole('radio', { name: 'Name' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Descending' }));
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByLabelText('Sort by Name descending')).toBeTruthy();
  });

  it('hands unfinished tabs and the action menu to the canonical app', () => {
    const onOpenCanonicalCollection = jest.fn();
    render(<Harness onOpenCanonicalCollection={onOpenCanonicalCollection} />);

    fireEvent.press(screen.getByRole('tab', { name: /tags/i }));
    fireEvent.press(screen.getByRole('tab', { name: /wishlist/i }));
    fireEvent.press(screen.getByLabelText('Open action menu'));
    expect(onOpenCanonicalCollection).toHaveBeenCalledTimes(3);
  });
});
