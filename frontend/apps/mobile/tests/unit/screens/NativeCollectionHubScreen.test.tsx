import { fireEvent, render, screen } from '@testing-library/react-native';
import type {
  NativeCollectionRow,
  NativeTagSummary,
} from '../../../src/features/collection/collectionModel';
import { NativeCollectionHubScreen } from '../../../src/screens/NativeCollectionHubScreen';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

const caughtRow: NativeCollectionRow = {
  id: 'caught-bulbasaur',
  pokemonId: 1,
  pokedexNumber: 1,
  name: 'Shiny Bulbasaur',
  imageUri: 'https://pokegonexus.com/images/shiny/shiny_pokemon_1.png',
  locationBackgroundUri: null,
  maxKind: null,
  purified: false,
  lucky: false,
  typeIconUris: [],
  status: 'caught',
  source: 'instance',
  cp: 500,
  favorite: true,
  mostWanted: false,
};

const wantedRow: NativeCollectionRow = {
  ...caughtRow,
  id: 'wanted-mewtwo',
  pokemonId: 150,
  pokedexNumber: 150,
  name: 'Shiny Mewtwo',
  status: 'wanted',
  cp: null,
  favorite: false,
  mostWanted: true,
};

const catalogBulbasaur: NativeCollectionRow = {
  ...caughtRow,
  id: '0001-default',
  name: 'Bulbasaur',
  cp: null,
  favorite: false,
  source: 'catalog',
};

const catalogMewtwo: NativeCollectionRow = {
  ...wantedRow,
  id: '0150-default',
  name: 'Mewtwo',
  mostWanted: false,
  source: 'catalog',
};

const inventoryTag: NativeTagSummary = {
  key: 'system:favorites',
  parent: 'caught',
  name: 'Favorites',
  color: '#ffd45a',
  tone: 'favorites',
  rows: [caughtRow],
};

const allCaughtTag: NativeTagSummary = {
  key: 'system:caught',
  parent: 'caught',
  name: 'All Caught',
  color: '#5798ff',
  tone: 'caught',
  rows: [caughtRow],
};

const wishlistTag: NativeTagSummary = {
  key: 'system:most-wanted',
  parent: 'wanted',
  name: 'Most Wanted',
  color: '#ff704d',
  tone: 'most-wanted',
  rows: [wantedRow],
};

describe('NativeCollectionHubScreen', () => {
  it('uses one stateful hub for tab changes, tag selection, and opening entries', () => {
    const onOpenEntry = jest.fn();
    render(
      <NativeCollectionHubScreen
        assetBaseUrl="https://pokegonexus.com"
        catalogRows={[catalogBulbasaur, catalogMewtwo]}
        error={null}
        inventoryTags={[inventoryTag, allCaughtTag]}
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onOpenEntry={onOpenEntry}
        onRetry={jest.fn()}
        wishlistTags={[wishlistTag]}
      />,
    );

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Mewtwo')).toBeTruthy();
    expect(screen.queryByText('Shiny Bulbasaur')).toBeNull();
    expect(screen.queryByText('Shiny Mewtwo')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: /tags/i }));
    expect(screen.getByText('1 Pokémon')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Open Favorites/i }));

    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getByText('Shiny Bulbasaur')).toBeTruthy();
    expect(screen.queryByText('Shiny Mewtwo')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'View Shiny Bulbasaur' }));
    expect(onOpenEntry).toHaveBeenCalledWith(caughtRow);

    fireEvent.press(screen.getByRole('button', { name: /Clear Favorites tag filter/i }));
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Mewtwo')).toBeTruthy();
    expect(screen.queryByText('Shiny Bulbasaur')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: /wishlist/i }));
    expect(screen.getByText('Wishlist tags')).toBeTruthy();
    expect(screen.getByText('Most Wanted')).toBeTruthy();
  });
});
