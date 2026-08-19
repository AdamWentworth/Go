import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import ConfirmationOverlay from '@/pages/Search/views/ConfirmationOverlay';
import { OVERLAY_MOTION_DURATION_MS } from '@/components/OverlayPortal';

describe('ConfirmationOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the expected confirmation prompt', () => {
    render(
      <ConfirmationOverlay
        username="fakeUser0632"
        pokemonDisplayName="Shiny Pikachu"
        instanceId="instance-1"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Would you like to see fakeUser0632's Shiny Pikachu in their catalog?",
      ),
    ).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when Yes is clicked', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmationOverlay
        username="user"
        pokemonDisplayName="Pokemon"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(onConfirm).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(OVERLAY_MOTION_DURATION_MS));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls only onClose for No and blocks click propagation to parent', () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <ConfirmationOverlay
          username="user"
          pokemonDisplayName="Pokemon"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onConfirm).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(OVERLAY_MOTION_DURATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();

    fireEvent.click(document.body.querySelector('.confirmation-overlay') as Element);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
