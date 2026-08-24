import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeCollectionScreen } from '../../../src/screens/NativeCollectionScreen';

jest.mock('../../../src/features/collection/NativeCollectionSyncStatusCard', () => ({
  NativeCollectionSyncStatusCard: () => null,
}));

const row = {
  id: 'instance-1',
  pokemonId: 6,
  pokedexNumber: 6,
  name: 'Shiny Charizard',
  imageUri: 'https://pokegonexus.com/images/charizard.png',
  status: 'trade' as const,
  cp: 2499,
  favorite: false,
  mostWanted: false,
  locationBackgroundUri: null,
  luckyBackdropUri: null,
  maxBadgeUri: null,
  typeIconUris: [],
};

describe('NativeCollectionScreen', () => {
  it('renders a virtualized read-only collection and exposes filter controls', () => {
    const onFilterChange = jest.fn();
    const onOpenInstance = jest.fn();
    const onOpenCurrentApp = jest.fn();
    render(
      <NativeCollectionScreen
        rows={[row]}
        filter="all"
        query=""
        isLoading={false}
        error={null}
        cachedAt={null}
        actionMenuImageUri="https://pokegonexus.com/images/btn_action_menu.png"
        onFilterChange={onFilterChange}
        onQueryChange={jest.fn()}
        onRetry={jest.fn()}
        onOpenInstance={onOpenInstance}
        onOpenTags={jest.fn()}
        onOpenWishlist={jest.fn()}
        onOpenCurrentApp={onOpenCurrentApp}
      />,
    );

    expect(screen.getByText('Shiny Charizard')).toBeTruthy();
    expect(screen.getByText('Pokémon')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open Shiny Charizard' }));
    expect(onOpenInstance).toHaveBeenCalledWith('instance-1');
    fireEvent.press(screen.getByRole('tab', { name: 'Wanted Pokémon' }));
    expect(onFilterChange).toHaveBeenCalledWith('wanted');
    fireEvent.press(screen.getByRole('button', { name: 'Open action menu in current app' }));
    expect(onOpenCurrentApp).toHaveBeenCalledTimes(1);
  });

  it('makes cached offline data explicit', () => {
    render(
      <NativeCollectionScreen
        rows={[row]}
        filter="all"
        query=""
        isLoading={false}
        error={null}
        cachedAt={1234}
        actionMenuImageUri="https://pokegonexus.com/images/btn_action_menu.png"
        onFilterChange={jest.fn()}
        onQueryChange={jest.fn()}
        onRetry={jest.fn()}
        onOpenInstance={jest.fn()}
        onOpenTags={jest.fn()}
        onOpenWishlist={jest.fn()}
        onOpenCurrentApp={jest.fn()}
      />,
    );

    expect(screen.getByText('Offline copy')).toBeTruthy();
    expect(screen.getByText(/retained edits are shown/i)).toBeTruthy();
  });

  it('hands incomplete Tags and Wishlist sections to the current app', () => {
    const onOpenTags = jest.fn();
    const onOpenWishlist = jest.fn();
    render(
      <NativeCollectionScreen
        rows={[row]}
        filter="all"
        query=""
        isLoading={false}
        error={null}
        cachedAt={null}
        actionMenuImageUri="https://pokegonexus.com/images/btn_action_menu.png"
        onFilterChange={jest.fn()}
        onQueryChange={jest.fn()}
        onRetry={jest.fn()}
        onOpenInstance={jest.fn()}
        onOpenTags={onOpenTags}
        onOpenWishlist={onOpenWishlist}
        onOpenCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('tab', { name: 'Tags' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Wishlist' }));
    expect(onOpenTags).toHaveBeenCalledTimes(1);
    expect(onOpenWishlist).toHaveBeenCalledTimes(1);
  });
});
