import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import MetaPanel from '@/pages/Pokemon/features/instances/sections/MetaPanel';

const fetchPublicUserByUsernameMock = vi.hoisted(() => vi.fn());
const fetchTrainerAutocompleteMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/userSearchService', () => ({
  fetchPublicUserByUsername: fetchPublicUserByUsernameMock,
  fetchTrainerAutocomplete: fetchTrainerAutocompleteMock,
}));

vi.mock('@/components/pokemonComponents/LocationCaught', () => ({
  default: () => <div>location-caught</div>,
}));

vi.mock('@/components/pokemonComponents/DateCaught', () => ({
  default: () => <div>date-caught</div>,
}));

vi.mock('@/components/pokemonComponents/BallCaught', () => ({
  default: () => <div>ball-caught</div>,
}));

describe('MetaPanel', () => {
  it('does not overwrite typed trainer name with canonical lookup username', async () => {
    fetchPublicUserByUsernameMock.mockResolvedValue({
      type: 'success',
      username: 'CanonicalUser',
      userId: 'user-1',
    });
    fetchTrainerAutocompleteMock.mockResolvedValue({ type: 'success', results: [] });

    const onOriginalTrainerNameChange = vi.fn();
    const onOriginalTrainerIdChange = vi.fn();

    render(
      <MetaPanel
        pokemon={{ instanceData: {} }}
        editMode={true}
        isLucky={false}
        isTraded={true}
        isShadow={false}
        originalTrainerName={null}
        originalTrainerId={null}
        tradedDate={null}
        pokeball={null}
        onLocationChange={vi.fn()}
        onDateChange={vi.fn()}
        onIsTradedChange={vi.fn()}
        onOriginalTrainerNameChange={onOriginalTrainerNameChange}
        onOriginalTrainerIdChange={onOriginalTrainerIdChange}
        onTradedDateChange={vi.fn()}
        onPokeballChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Original Trainer Name:');
    fireEvent.change(input, { target: { value: 'PokePete35' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fetchPublicUserByUsernameMock).toHaveBeenCalledWith('PokePete35');
    });

    expect(onOriginalTrainerNameChange).toHaveBeenCalledWith('PokePete35');
    expect(onOriginalTrainerNameChange).not.toHaveBeenCalledWith('CanonicalUser');
    expect(onOriginalTrainerIdChange).toHaveBeenCalledWith('user-1');
  });

  it('keeps custom original trainer names when lookup returns notFound', async () => {
    fetchPublicUserByUsernameMock.mockResolvedValue({ type: 'notFound' });
    fetchTrainerAutocompleteMock.mockResolvedValue({ type: 'success', results: [] });

    const onOriginalTrainerNameChange = vi.fn();
    const onOriginalTrainerIdChange = vi.fn();

    render(
      <MetaPanel
        pokemon={{ instanceData: {} }}
        editMode={true}
        isLucky={false}
        isTraded={true}
        isShadow={false}
        originalTrainerName={null}
        originalTrainerId={null}
        tradedDate={null}
        pokeball={null}
        onLocationChange={vi.fn()}
        onDateChange={vi.fn()}
        onIsTradedChange={vi.fn()}
        onOriginalTrainerNameChange={onOriginalTrainerNameChange}
        onOriginalTrainerIdChange={onOriginalTrainerIdChange}
        onTradedDateChange={vi.fn()}
        onPokeballChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Original Trainer Name:');
    fireEvent.change(input, { target: { value: '  GuestTrainer  ' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fetchPublicUserByUsernameMock).toHaveBeenCalledWith('GuestTrainer');
    });

    expect(onOriginalTrainerNameChange).toHaveBeenCalledWith('GuestTrainer');
    expect(onOriginalTrainerIdChange).toHaveBeenCalledWith(null);
  });
});
