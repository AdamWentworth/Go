import { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeCollectionRow } from '../../../src/features/collection/collectionModel';
import {
  NativeCollectionParityScreen,
  type NativeCollectionParityScreenHandle,
  projectNativeCollectionParityCards,
} from '../../../src/screens/NativeCollectionParityScreen';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  cleanup();
  jest.useRealTimers();
});

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
      activeTag={null}
      assetBaseUrl="https://pokegonexus.com"
      rows={rows}
      query={query}
      isLoading={false}
      error={null}
      onQueryChange={setQuery}
      onRetry={jest.fn()}
      onOpenInstance={onOpenInstance}
      onOpenCanonicalCollection={onOpenCanonicalCollection}
      onClearTag={jest.fn()}
      onViewChange={jest.fn()}
    />
  );
};

describe('NativeCollectionParityScreen', () => {
  it('reuses the same card projection when a Pokémon appears in multiple tags', () => {
    const sharedRow = rows[0];
    const firstTagCards = projectNativeCollectionParityCards([sharedRow], true);
    const secondTagCards = projectNativeCollectionParityCards([rows[1], sharedRow], true);

    expect(secondTagCards[1]).toBe(firstTagCards[0]);
  });

  it('prepares every warmed tag surface for a same-frame reveal before page motion', () => {
    const ref = createRef<NativeCollectionParityScreenHandle>();
    const favorites = {
      key: 'system:favorites' as const,
      parent: 'caught' as const,
      name: 'Favorites',
      color: '#ffd45a',
      tone: 'favorites' as const,
      rows: [rows[0]],
    };
    render(
      <NativeCollectionParityScreen
        activeTag={null}
        assetBaseUrl="https://pokegonexus.com"
        error={null}
        isLoading={false}
        onClearTag={jest.fn()}
        onOpenInstance={jest.fn()}
        onQueryChange={jest.fn()}
        onRetry={jest.fn()}
        onViewChange={jest.fn()}
        query=""
        ref={ref}
        rows={rows}
        warmCatalogRows={rows}
        warmTags={[favorites]}
      />,
    );

    expect(screen.queryByTestId(
      'native-collection-surface-system:favorites',
      { includeHiddenElements: true },
    )).toBeNull();
    act(() => jest.advanceTimersByTime(240));

    expect(screen.getByTestId(
      'native-collection-surface-system:favorites',
      { includeHiddenElements: true },
    )).toHaveStyle({ opacity: 0 });
    expect(ref.current?.revealSurface('system:favorites')).toBe(true);
    expect(ref.current?.revealSurface('system:missing')).toBe(false);
  });

  it('starts in the complete catalog context', () => {
    render(<Harness />);

    expect(screen.getByText('Bulbasaur')).toBeTruthy();
    expect(screen.getByText('Charizard')).toBeTruthy();
  });

  it('searches the connected rows and opens a real instance', () => {
    const onOpenInstance = jest.fn();
    render(<Harness onOpenInstance={onOpenInstance} />);

    fireEvent.changeText(screen.getByLabelText('Search Pokémon'), 'char');
    expect(screen.queryByText('Bulbasaur')).toBeNull();
    expect(screen.getByText('Charizard')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'View Charizard' }));
    expect(onOpenInstance).toHaveBeenCalledWith('charizard', ['charizard']);
  });

  it('matches the canonical focus-to-filter and filter-to-results workflow', () => {
    render(<Harness />);

    fireEvent(screen.getByLabelText('Search Pokémon'), 'focus');
    expect(screen.getByLabelText('Pokémon search filters')).toBeTruthy();
    expect(screen.queryByText('Bulbasaur')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Filter by Fire' }));
    expect(screen.queryByLabelText('Pokémon search filters')).toBeNull();
    expect(screen.getByLabelText('Clear Pokémon search')).toBeTruthy();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('lets the user choose an actual sort and direction', () => {
    render(<Harness />);

    fireEvent.press(screen.getByLabelText('Sort by NUMBER ascending'));
    fireEvent.press(screen.getByRole('radio', { name: /name/i }));
    expect(screen.getByLabelText('Sort by NAME ascending')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Sort by NAME ascending'));
    fireEvent.press(screen.getByRole('radio', { name: /name/i }));
    expect(screen.getByLabelText('Sort by NAME descending')).toBeTruthy();
  });

  it('keeps the action menu callback available', () => {
    const onOpenCanonicalCollection = jest.fn();
    render(<Harness onOpenCanonicalCollection={onOpenCanonicalCollection} />);

    fireEvent.press(screen.getByLabelText('Open action menu'));
    expect(onOpenCanonicalCollection).toHaveBeenCalledTimes(1);
  });
});
