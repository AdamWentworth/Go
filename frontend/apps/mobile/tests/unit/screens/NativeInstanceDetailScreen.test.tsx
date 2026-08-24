import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeInstanceDetailScreen } from '../../../src/screens/NativeInstanceDetailScreen';

jest.mock('../../../src/features/collection/NativeCollectionSyncStatusCard', () => ({
  NativeCollectionSyncStatusCard: () => null,
}));

const detail = {
  row: {
    id: 'instance-1',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Shiny Charizard',
    imageUri: 'https://pokegonexus.com/images/charizard.png',
    locationBackgroundUri: null,
    maxKind: null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'trade' as const,
    cp: 2499,
    favorite: false,
    mostWanted: false,
  },
  traits: ['Shiny'],
  stats: [{ label: 'CP', value: '2,499' }],
  ivs: [{ label: 'Attack', value: 15 }],
  moves: [{ label: 'Fast move', value: 'Fire Spin' }],
  provenance: [],
  preferences: [{ label: 'Friendship', value: '5/5 hearts' }],
};

describe('NativeInstanceDetailScreen', () => {
  it('renders canonical Pokémon details and keeps editing behind the fallback', () => {
    const onEditInCurrentApp = jest.fn();
    render(
      <NativeInstanceDetailScreen
        detail={detail}
        isLoading={false}
        error={null}
        cachedAt={null}
        movesWarning={null}
        saveNotice={null}
        saveError={null}
        isSaving={false}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={onEditInCurrentApp}
      />,
    );

    expect(screen.getByText('Shiny Charizard')).toBeTruthy();
    expect(screen.getByText('Fire Spin')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Edit in current app' }));
    expect(onEditInCurrentApp).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable missing-instance state', () => {
    const onBack = jest.fn();
    render(
      <NativeInstanceDetailScreen
        detail={null}
        isLoading={false}
        error={null}
        cachedAt={null}
        movesWarning={null}
        saveNotice={null}
        saveError={null}
        isSaving={false}
        onRetry={jest.fn()}
        onBack={onBack}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    expect(screen.getByText('This instance was not found.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back to collection' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('offers the native Favorite action only for a caught Pokémon', () => {
    const onToggleFavorite = jest.fn();
    render(
      <NativeInstanceDetailScreen
        detail={{ ...detail, row: { ...detail.row, status: 'caught', favorite: false } }}
        isLoading={false}
        error={null}
        cachedAt={1234}
        movesWarning={null}
        saveNotice="Saved on this device."
        saveError={null}
        isSaving={false}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onToggleFavorite={onToggleFavorite}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Mark as Favorite' }));
    expect(onToggleFavorite).toHaveBeenCalledWith(true);
    expect(screen.getByText('Saved on this device.')).toBeTruthy();
    expect(screen.getByText('Viewing an offline copy')).toBeTruthy();
  });
});
