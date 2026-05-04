import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  CaughtMetadataFields,
  MetaCaughtSummary,
  MetaTradeSummary,
  TradeMetadataFields,
  TrainerLookupInput,
} from '@/pages/Pokemon/features/instances/sections/MetaPanelFields';

vi.mock('@/components/pokemonComponents/LocationCaught', () => ({
  default: ({ onLocationChange }: { onLocationChange?: (value: string) => void }) => (
    <button type="button" onClick={() => onLocationChange?.('Seattle')}>
      location-caught
    </button>
  ),
}));

vi.mock('@/components/pokemonComponents/DateCaught', () => ({
  default: ({ onDateChange }: { onDateChange?: (value: string) => void }) => (
    <button type="button" onClick={() => onDateChange?.('2026-02-17')}>
      date-caught
    </button>
  ),
}));

vi.mock('@/components/pokemonComponents/BallCaught', () => ({
  default: ({ onChange }: { onChange?: (value: string | null) => void }) => (
    <button type="button" onClick={() => onChange?.('ultra_ball')}>
      ball-caught
    </button>
  ),
}));

describe('MetaPanelFields', () => {
  it('renders trade and caught summary display values', () => {
    render(
      <>
        <MetaTradeSummary
          originalTrainerDisplay="Trainer Red"
          tradedDateDisplay="2026-02-11"
        />
        <MetaCaughtSummary rawLocation="Seattle" dateDisplay="2026-02-17" pokeball="poke_ball" />
      </>,
    );

    expect(screen.getByText('OBTAINED IN A TRADE')).toBeInTheDocument();
    expect(screen.getByText('Trainer Red')).toBeInTheDocument();
    expect(screen.getByText('2026-02-11')).toBeInTheDocument();
    expect(screen.getByText('CAUGHT')).toBeInTheDocument();
    expect(screen.getByText('Seattle')).toBeInTheDocument();
    expect(screen.getByText('2026-02-17')).toBeInTheDocument();
    expect(document.querySelector('.meta-ball-image')).not.toBeNull();
  });

  it('wires trainer lookup input events, suggestions, and status text', () => {
    const onTrainerNameChange = vi.fn();
    const onTrainerNameFocus = vi.fn();
    const onTrainerNameBlur = vi.fn();
    const onTrainerSuggestionSelect = vi.fn();

    const { rerender } = render(
      <TrainerLookupInput
        trainerQuery="As"
        trainerSuggestions={[{ username: 'Ash' }]}
        trainerLookupBusy={false}
        trainerLookupError="Could not verify"
        showTrainerSuggestions={true}
        onTrainerNameChange={onTrainerNameChange}
        onTrainerNameFocus={onTrainerNameFocus}
        onTrainerNameBlur={onTrainerNameBlur}
        onTrainerSuggestionSelect={onTrainerSuggestionSelect}
      />,
    );

    const input = screen.getByLabelText('Original Trainer Name:');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ash' } });
    fireEvent.blur(input);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Ash' }));

    expect(onTrainerNameFocus).toHaveBeenCalledTimes(1);
    expect(onTrainerNameChange).toHaveBeenCalledWith('Ash');
    expect(onTrainerNameBlur).toHaveBeenCalledTimes(1);
    expect(onTrainerSuggestionSelect).toHaveBeenCalledWith({ username: 'Ash' });
    expect(screen.getByText('Could not verify')).toBeInTheDocument();

    rerender(
      <TrainerLookupInput
        trainerQuery="As"
        trainerSuggestions={[]}
        trainerLookupBusy={true}
        trainerLookupError="Could not verify"
        showTrainerSuggestions={false}
        onTrainerNameChange={onTrainerNameChange}
        onTrainerNameFocus={onTrainerNameFocus}
        onTrainerNameBlur={onTrainerNameBlur}
        onTrainerSuggestionSelect={onTrainerSuggestionSelect}
      />,
    );

    expect(screen.getByText('Looking up trainer...')).toBeInTheDocument();
    expect(screen.queryByText('Could not verify')).not.toBeInTheDocument();
  });

  it('wires trade metadata toggles and traded date edits', () => {
    const onIsTradedChange = vi.fn();
    const onTradedDateChange = vi.fn();

    render(
      <TradeMetadataFields
        obtainedInTrade={true}
        isShadow={false}
        isLucky={true}
        trainerQuery=""
        trainerSuggestions={[]}
        trainerLookupBusy={false}
        trainerLookupError={null}
        showTrainerSuggestions={false}
        tradedDateInputValue="2026-02-11"
        onIsTradedChange={onIsTradedChange}
        onTradedDateChange={onTradedDateChange}
        onTrainerNameChange={vi.fn()}
        onTrainerNameFocus={vi.fn()}
        onTrainerNameBlur={vi.fn()}
        onTrainerSuggestionSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.change(screen.getByLabelText('Traded Date:'), {
      target: { value: '2026-02-12' },
    });

    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
    expect(screen.getByText('Lucky Pokemon are always traded.')).toBeInTheDocument();
    expect(onIsTradedChange).toHaveBeenCalledWith(true);
    expect(onTradedDateChange).toHaveBeenCalledWith('2026-02-12');
  });

  it('wires caught metadata child controls', () => {
    const onLocationChange = vi.fn();
    const onDateChange = vi.fn();
    const onPokeballChange = vi.fn();

    render(
      <CaughtMetadataFields
        pokemon={{ instanceData: {} }}
        editMode={true}
        pokeball={null}
        onLocationChange={onLocationChange}
        onDateChange={onDateChange}
        onPokeballChange={onPokeballChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'location-caught' }));
    fireEvent.click(screen.getByRole('button', { name: 'date-caught' }));
    fireEvent.click(screen.getByRole('button', { name: 'ball-caught' }));

    expect(onLocationChange).toHaveBeenCalledWith('Seattle');
    expect(onDateChange).toHaveBeenCalledWith('2026-02-17');
    expect(onPokeballChange).toHaveBeenCalledWith('ultra_ball');
  });
});
