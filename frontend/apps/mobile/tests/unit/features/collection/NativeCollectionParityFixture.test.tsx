import { render, screen } from '@testing-library/react-native';
import { NativeCollectionParityFixture } from '../../../../src/features/collection/parity/NativeCollectionParityFixture';
import { COLLECTION_PARITY_FIXTURES } from '../../../../src/features/collection/parity/collectionParityFixtures';

const mockUseWindowDimensions = jest.fn(() => ({
  width: 412,
  height: 915,
  scale: 2.625,
  fontScale: 1,
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}));

describe('NativeCollectionParityFixture', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({
      width: 412,
      height: 915,
      scale: 2.625,
      fontScale: 1,
    });
  });

  it('preserves the canonical mobile collection hierarchy without native redesign copy', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getByRole('tab', { name: /tags/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /pokémon/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /wishlist/i })).toBeTruthy();
    expect(screen.getByLabelText('Search Pokémon')).toBeTruthy();
    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.queryByText('NATIVE COLLECTION')).toBeNull();
    expect(screen.queryByText('Your Pokémon')).toBeNull();
    expect(screen.queryByText('Edit in current app')).toBeNull();
  });

  it('renders all canonical card fixtures and their layered state signals', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getAllByLabelText('Favorite')).toHaveLength(9);
    expect(screen.getAllByLabelText('Gigantamax')).toHaveLength(2);
    expect(screen.getByLabelText('Sort by Pokédex number ascending')).toBeTruthy();
    expect(screen.getByLabelText('Open action menu')).toBeTruthy();
    for (const card of COLLECTION_PARITY_FIXTURES) {
      expect(screen.getByTestId(`parity-card-${card.id}`)).toBeTruthy();
      expect(screen.getByText(card.name)).toBeTruthy();
    }
  });

  it('supports the remaining canonical card layers and non-clearable wanted context', () => {
    render(
      <NativeCollectionParityFixture
        activeTag="Most Wanted"
        cards={[
          {
            id: 'purified-dynamax-wanted',
            cp: null,
            dexNumber: 9,
            name: 'Purified Dynamax Blastoise',
            imagePath: '/images/shiny/shiny_pokemon_9.png',
            typeIconPaths: ['/images/types/water.png'],
            maxKind: 'dynamax',
            mostWanted: true,
            ownership: 'wanted',
            purified: true,
          },
        ]}
        collectionCount={1}
        tagCanClear={false}
        tagTone="most-wanted"
      />,
    );

    expect(screen.getByText('(MOST WANTED)')).toBeTruthy();
    expect(screen.getByLabelText('Most Wanted')).toBeTruthy();
    expect(screen.getByLabelText('Dynamax')).toBeTruthy();
    expect(screen.getByLabelText('Purified')).toBeTruthy();
    expect(screen.getByTestId(
      'native-wanted-status-glow',
      { includeHiddenElements: true },
    )).toBeTruthy();
    expect(screen.queryByLabelText('Clear Most Wanted tag filter')).toBeNull();
  });

  it.each(['caught', 'trade', 'wanted'] as const)(
    'renders the canonical radial %s ownership glow behind tagged Pokémon',
    (ownership) => {
      render(
        <NativeCollectionParityFixture
          cards={[{
            ...COLLECTION_PARITY_FIXTURES[0],
            id: `${ownership}-glow-card`,
            ownership,
          }]}
        />,
      );

      expect(screen.getByTestId(
        `native-${ownership}-status-glow`,
        { includeHiddenElements: true },
      )).toBeTruthy();
    },
  );

  it('keeps incomplete mobile rows at the canonical three-column width', () => {
    render(<NativeCollectionParityFixture cards={COLLECTION_PARITY_FIXTURES.slice(0, 1)} />);

    expect(screen.getByTestId('parity-card-shiny-shadow-venusaur')).toHaveStyle({ width: 126 });
  });

  it.each([
    [480, 149],
    [481, 70],
    [1023, 161],
    [1024, 104],
  ])('preserves the canonical responsive grid boundary at %i px', (width, cardWidth) => {
    mockUseWindowDimensions.mockReturnValue({
      width,
      height: 915,
      scale: 2.625,
      fontScale: 1,
    });

    render(<NativeCollectionParityFixture cards={COLLECTION_PARITY_FIXTURES.slice(0, 1)} />);

    expect(screen.getByTestId('parity-card-shiny-shadow-venusaur')).toHaveStyle({
      width: cardWidth,
    });
  });

  it('renders user-selected custom tag identity in both header and chip', () => {
    render(
      <NativeCollectionParityFixture
        activeTag="Shadow Shinies"
        customTagColor="#6f35c5"
        tagTone="custom"
        theme="light"
      />,
    );

    expect(screen.getByText('(SHADOW SHINIES)')).toBeTruthy();
    expect(screen.getByText('Shadow Shinies')).toBeTruthy();
    expect(screen.getByLabelText('Clear Shadow Shinies tag filter')).toBeTruthy();
  });

  it('keeps the fixture disconnected from user actions', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getByTestId('native-collection-parity-fixture')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Favorite Pokémon')).toBeNull();
  });
});
