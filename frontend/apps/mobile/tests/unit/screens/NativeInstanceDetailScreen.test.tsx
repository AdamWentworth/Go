import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

  it('preserves the canonical animated previous and next overlay controls', async () => {
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
    await waitFor(() => expect(onPrevious).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByRole('button', { name: 'Next Pokémon' }));
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
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
            lucky: false,
            shadow: false,
            purified: false,
            is_traded: false,
            original_trainer_id: null,
            original_trainer_name: null,
            traded_date: null,
            pokeball: null,
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
    fireEvent.press(screen.getByRole('button', { name: 'LUCKY: YES' }));
    fireEvent.changeText(screen.getByLabelText('Original trainer name'), 'TradePartner');
    fireEvent.changeText(screen.getByLabelText('Traded date'), '2026-08-23');
    fireEvent.press(screen.getByRole('button', { name: 'Ball caught: BEAST BALL' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      nickname: 'Fire Partner',
      cp: 2500,
      level: 40,
      gender: 'Male',
      attack_iv: 15,
      lucky: true,
      is_traded: true,
      original_trainer_name: 'TradePartner',
      traded_date: '2026-08-23',
      pokeball: 'beast_ball',
    }));
    expect(screen.queryByLabelText('Pokémon detail editor')).toBeNull();
  });

  it('selects compatible moves and a location background inside the native editor', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          instance: {
            nickname: null,
            cp: 2499,
            level: 40,
            fast_move_id: null,
            charged_move1_id: null,
            charged_move2_id: null,
            location_card: null,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: { ...detail.row, status: 'caught' },
          moveOptions: [
            { id: 101, name: 'Fire Spin', kind: 'fast', legacy: false, typeName: 'Fire' },
            { id: 102, name: 'Blast Burn', kind: 'charged', legacy: true, typeName: 'Fire' },
          ],
          backgroundOptions: [{
            id: 9,
            name: 'Vancouver City Safari',
            imageUri: 'https://pokegonexus.com/images/vancouver-location.png',
          }],
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
    fireEvent.press(screen.getByRole('button', { name: 'Choose fast move' }));
    fireEvent.press(screen.getByRole('button', { name: 'Fire Spin' }));
    fireEvent.press(screen.getByRole('button', { name: 'Choose charged move' }));
    fireEvent.press(screen.getByRole('button', { name: 'Blast Burn' }));
    fireEvent.press(screen.getByRole('button', { name: 'Choose location background' }));
    fireEvent.press(screen.getByRole('button', { name: 'Use Vancouver City Safari background' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      fast_move_id: 101,
      charged_move1_id: 102,
      location_card: '9',
    }));
  });

  it('keeps Lucky and traded controls constrained for an unpurified Shadow Pokémon', () => {
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          instance: {
            nickname: null,
            shadow: true,
            purified: false,
            lucky: false,
            is_traded: false,
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
        onSaveDetails={jest.fn().mockResolvedValue(undefined)}
        onToggleFavorite={jest.fn()}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Edit Pokémon' }));

    expect(screen.queryByRole('button', { name: 'LUCKY: YES' })).toBeNull();
    expect(screen.getByRole('button', { name: 'OBTAINED IN A TRADE: YES' })
      .props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Shadow Pokémon cannot be traded until purified.')).toBeTruthy();
  });

  it('purifies and restores a caught Shadow Pokémon with canonical trade invariants', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          appearanceImageUris: {
            shadow: 'https://pokegonexus.com/images/shadow-charizard.png',
            purified: 'https://pokegonexus.com/images/charizard.png',
          },
          instance: {
            nickname: null,
            shadow: true,
            purified: false,
            lucky: false,
            is_traded: false,
            costume_id: null,
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
    fireEvent.press(screen.getByRole('button', { name: 'Shadow state: Purified' }));
    expect(screen.getByLabelText('Purified')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'LUCKY: YES' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Shadow state: Shadow' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      shadow: true,
      purified: false,
      lucky: false,
      is_traded: false,
    }));
  });

  it('edits all three Max Move levels for an eligible instance', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          instance: {
            nickname: null,
            shadow: false,
            purified: false,
            costume_id: null,
            dynamax: true,
            gigantamax: false,
            max_attack: 1,
            max_guard: 0,
            max_spirit: 0,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: { ...detail.row, status: 'caught', maxKind: 'dynamax' },
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
    fireEvent.press(screen.getByRole('button', { name: 'Max Attack: 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Max Guard: 2' }));
    fireEvent.press(screen.getByRole('button', { name: 'Max Spirit: 1' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      max_attack: 3,
      max_guard: 2,
      max_spirit: 1,
    }));
  });

  it('selects and clears native Mega forms with live canonical state', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          appearanceImageUris: {
            base: 'https://pokegonexus.com/images/charizard.png',
            shadow: 'https://pokegonexus.com/images/shadow-charizard.png',
            purified: 'https://pokegonexus.com/images/charizard.png',
          },
          megaOptions: [
            { form: 'x', imageUri: 'https://pokegonexus.com/images/mega-x.png', label: 'Mega X', primal: false },
            { form: 'y', imageUri: 'https://pokegonexus.com/images/mega-y.png', label: 'Mega Y', primal: false },
          ],
          instance: {
            nickname: null,
            shadow: false,
            purified: false,
            costume_id: null,
            mega: false,
            is_mega: false,
            mega_form: null,
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
    fireEvent.press(screen.getByRole('button', { name: 'Power form: Mega Y' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });
    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      mega: true,
      is_mega: true,
      mega_form: 'y',
    }));
  });

  it('unlocks special Max Move editing when a Crowned form is selected', async () => {
    const onSaveDetails = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeInstanceDetailScreen
        detail={{
          ...detail,
          appearanceImageUris: {
            base: 'https://pokegonexus.com/images/zacian.png',
            shadow: null,
            purified: 'https://pokegonexus.com/images/zacian.png',
          },
          crownOptions: [{
            form: 'Crowned Sword',
            imageUri: 'https://pokegonexus.com/images/crowned-zacian.png',
            label: 'Crowned Sword',
          }],
          instance: {
            nickname: null,
            pokemon_id: 888,
            shadow: false,
            purified: false,
            costume_id: null,
            crown: false,
            max_attack: null,
            max_guard: null,
            max_spirit: null,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: { ...detail.row, pokemonId: 888, status: 'caught' },
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
    expect(screen.queryByText('Max Move Levels')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Power form: Crowned Sword' }));
    expect(screen.getByText('Max Move Levels')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Max Attack: 3' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Pokémon' }));
    });
    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      crown: true,
      fusion_form: 'Crowned Sword',
      max_attack: 3,
      max_guard: 0,
      max_spirit: 0,
    }));
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
            wanted_size_preferences: null,
          } as NonNullable<NativeInstanceDetail['instance']>,
          row: {
            ...detail.row,
            id: 'wanted-1',
            status: 'wanted',
            mostWanted: false,
          },
          sizeThresholds: {
            pokedex_height: 1,
            pokedex_weight: 10,
            height_standard_deviation: 0.1,
            weight_standard_deviation: 1,
            height_xxs_threshold: 1,
            height_xs_threshold: 2,
            height_xl_threshold: 3,
            height_xxl_threshold: 4,
            weight_xxs_threshold: 10,
            weight_xs_threshold: 20,
            weight_xl_threshold: 30,
            weight_xxl_threshold: 40,
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
    fireEvent.press(screen.getByRole('button', { name: 'XXL weight' }));
    fireEvent.press(screen.getByRole('button', { name: 'XS height' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save wanted listing' }));
    });

    expect(onSaveDetails).toHaveBeenCalledWith(expect.objectContaining({
      friendship_level: 5,
      pref_lucky: true,
      most_wanted: true,
      wanted_size_preferences: {
        weight: {
          category: 'XXL',
          min: 40,
          max: null,
          min_inclusive: false,
          max_inclusive: false,
        },
        height: {
          category: 'XS',
          min: 1,
          max: 2,
          min_inclusive: true,
          max_inclusive: false,
        },
      },
    }));
  });
});
