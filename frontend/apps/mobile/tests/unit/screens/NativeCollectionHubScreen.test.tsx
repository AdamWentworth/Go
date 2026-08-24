import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  filterName: 'Caught',
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
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 915 },
        insets: { top: 24, right: 0, bottom: 20, left: 0 },
      }}>
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
        />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Mewtwo')).toBeTruthy();
    expect(screen.queryByText('Shiny Bulbasaur')).toBeNull();
    expect(screen.queryByText('Shiny Mewtwo')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: /tags/i }));
    expect(screen.getByRole('tab', { name: /pokémon/i }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole('tab', { name: /tags/i }).props.accessibilityState).toEqual({
      selected: false,
    });
    fireEvent(screen.getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    expect(screen.getByRole('tab', { name: /tags/i }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByText('1 Pokémon')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Open Favorites/i }));
    fireEvent(screen.getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 412, y: 0 } },
    });

    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getByText('Shiny Bulbasaur')).toBeTruthy();
    expect(screen.queryByText('Shiny Mewtwo')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'View Shiny Bulbasaur' }));
    expect(onOpenEntry).toHaveBeenCalledWith(caughtRow);

    fireEvent.press(screen.getByRole('button', { name: /Clear Favorites tag filter/i }));
    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Mewtwo')).toBeTruthy();
    expect(screen.queryByText('Shiny Bulbasaur')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: /tags/i }));
    fireEvent(screen.getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    fireEvent.press(screen.getByRole('button', { name: /Open All Caught/i }));
    fireEvent(screen.getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 412, y: 0 } },
    });
    expect(screen.getByText('Caught')).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: /wishlist/i }));
    fireEvent(screen.getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 824, y: 0 } },
    });
    expect(screen.getByLabelText('Wanted tags')).toBeTruthy();
    expect(screen.getByText('Most Wanted')).toBeTruthy();
  });

  it('opens the canonical quick-navigation menu instead of replacing the collection', () => {
    const onActionMenuNavigate = jest.fn();
    render(
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 915 },
        insets: { top: 24, right: 0, bottom: 20, left: 0 },
      }}>
        <NativeCollectionHubScreen
          assetBaseUrl="https://pokegonexus.com"
          catalogRows={[catalogBulbasaur]}
          error={null}
          inventoryTags={[inventoryTag, allCaughtTag]}
          isLoading={false}
          onActionMenuNavigate={onActionMenuNavigate}
          onActionMenuPress={jest.fn()}
          onOpenEntry={jest.fn()}
          onRetry={jest.fn()}
          wishlistTags={[wishlistTag]}
        />
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getAllByRole('button', { name: 'Open action menu' })[0]);

    expect(screen.getByTestId('native-action-menu')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pokémon' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trades' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    expect(onActionMenuNavigate).toHaveBeenCalledWith('/search');
  });

  it('selects catalog variants in place and opens the canonical organizer', () => {
    const onOpenEntry = jest.fn();
    const onOrganizeCatalog = jest.fn().mockResolvedValue({ message: '1 Pokémon added.' });
    render(
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 915 },
        insets: { top: 24, right: 0, bottom: 20, left: 0 },
      }}>
        <NativeCollectionHubScreen
          assetBaseUrl="https://pokegonexus.com"
          catalogRows={[catalogBulbasaur, catalogMewtwo]}
          error={null}
          inventoryTags={[inventoryTag, allCaughtTag]}
          isLoading={false}
          onActionMenuPress={jest.fn()}
          onOpenEntry={onOpenEntry}
          onOrganizeCatalog={onOrganizeCatalog}
          onRetry={jest.fn()}
          wishlistTags={[wishlistTag]}
        />
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Select Bulbasaur' }));

    expect(onOpenEntry).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Add \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'X' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SELECT ALL' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: /Add \(1\)/i }));
    expect(screen.getByRole('header', { name: 'Add Pokémon' })).toBeTruthy();
    expect(screen.getByText('1 selected')).toBeTruthy();
  });
});
