import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ConfirmationOverlay from '@/pages/Search/views/ConfirmationOverlay';

describe('ConfirmationOverlay', () => {
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

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls only onClose for No and blocks click propagation to parent', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const parentClick = vi.fn();

    const { container } = render(
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
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('.confirmation-overlay') as Element);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
