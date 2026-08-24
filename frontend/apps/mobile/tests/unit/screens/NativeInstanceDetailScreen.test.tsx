import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeInstanceDetail } from '../../../src/features/collection/collectionModel';
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
  targetRows: [{
    id: 'wanted-1',
    pokemonId: 9,
    pokedexNumber: 9,
    name: 'Gigantamax Blastoise',
    imageUri: 'https://pokegonexus.com/images/blastoise.png',
    locationBackgroundUri: null,
    maxKind: 'gigantamax' as const,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'wanted' as const,
    cp: null,
    favorite: false,
    mostWanted: true,
  }],
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
    expect(screen.getByText('Wanted Pokémon')).toBeTruthy();
    expect(screen.queryByText('15')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Edit Pokémon' }));
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

  it('preserves the canonical previous and next overlay controls', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
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
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Previous Pokémon' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next Pokémon' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('opens a configured target directly from the listing summary', () => {
    const onOpenTarget = jest.fn();
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
        onOpenTarget={onOpenTarget}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Open Gigantamax Blastoise' }));
    expect(onOpenTarget).toHaveBeenCalledWith('wanted-1');
  });

  it('edits and saves caught instance details without leaving the native overlay', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          instance: {
            nickname: 'Charizard',
            cp: 2499,
            level: 40,
            gender: 'Male',
            weight: 90.5,
            height: 1.7,
            attack_iv: 15,
            defense_iv: 14,
            stamina_iv: 13,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: { ...detail.row, status: 'caught' },
        }}
        isLoading={false}
        error={null}
        cachedAt={null}
        movesWarning={null}
        saveNotice={null}
        saveError={null}
        isSaving={false}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onSaveDetails={onSaveDetails}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Edit Pokémon' }));
    fireEvent.changeText(screen.getByLabelText('Pokémon nickname'), 'Fire Partner');
    fireEvent.changeText(screen.getByLabelText('Combat Power'), '2500');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      nickname: 'Fire Partner',
      cp: 2500,
      level: 40,
      gender: 'Male',
      attack_iv: 15,
    }));
    expect(screen.queryByLabelText('Pokémon detail editor')).toBeNull();
  });

  it('saves five-heart, lucky, and Most Wanted conditions natively', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          instance: {
            nickname: null,
            friendship_level: 4,
            pref_lucky: false,
            most_wanted: false,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: {
            ...detail.row,
            id: 'wanted-1',
            status: 'wanted',
            mostWanted: false,
          },
        }}
        isLoading={false}
        error={null}
        cachedAt={null}
        movesWarning={null}
        saveNotice={null}
        saveError={null}
        isSaving={false}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onSaveDetails={onSaveDetails}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Edit wanted listing' }));
    fireEvent.press(screen.getByRole('button', { name: 'Set friendship to 5 hearts' }));
    fireEvent.press(screen.getByRole('button', { name: 'Lucky trade not requested' }));
    fireEvent.press(screen.getByRole('button', { name: 'Mark as Most Wanted' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save wanted listing' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      friendship_level: 5,
      pref_lucky: true,
      most_wanted: true,
    }));
  });
});
