import { render, screen } from '@testing-library/react-native';
import { NativeCollectionParityFixture } from '../../../../src/features/collection/parity/NativeCollectionParityFixture';
import { COLLECTION_PARITY_FIXTURES } from '../../../../src/features/collection/parity/collectionParityFixtures';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

describe('NativeCollectionParityFixture', () => {
  it('preserves the canonical mobile collection hierarchy without native redesign copy', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getByRole('tab', { name: /tags/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /pokémon/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /wishlist/i })).toBeTruthy();
    expect(screen.getByLabelText('Search')).toBeTruthy();
    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.queryByText('NATIVE COLLECTION')).toBeNull();
    expect(screen.queryByText('Your Pokémon')).toBeNull();
    expect(screen.queryByText('Edit in current app')).toBeNull();
  });

  it('renders all canonical card fixtures and their layered state signals', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getAllByLabelText('Favorite')).toHaveLength(2);
    expect(screen.getAllByLabelText('Gigantamax')).toHaveLength(2);
    for (const card of COLLECTION_PARITY_FIXTURES) {
      expect(screen.getByTestId(`parity-card-${card.id}`)).toBeTruthy();
      expect(screen.getByText(card.name)).toBeTruthy();
    }
  });

  it('keeps the fixture disconnected from user actions', () => {
    render(<NativeCollectionParityFixture />);

    expect(screen.getByTestId('native-collection-parity-fixture')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Favorite Pokémon')).toBeNull();
  });
});
