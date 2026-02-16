import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeStatusButtons from '@/pages/Trades/TradeStatusButtons';

describe('TradeStatusButtons', () => {
  it('renders all status controls and marks the selected one active', () => {
    const setSelectedStatus = vi.fn();

    render(
      <TradeStatusButtons
        selectedStatus="Pending"
        setSelectedStatus={setSelectedStatus}
      />,
    );

    expect(screen.getByRole('button', { name: 'Offers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proposed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Pending' })).toHaveClass('active');
  });

  it('emits canonical status values when buttons are clicked', () => {
    const setSelectedStatus = vi.fn();

    render(
      <TradeStatusButtons
        selectedStatus="Pending"
        setSelectedStatus={setSelectedStatus}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Offers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Proposed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelled' }));

    expect(setSelectedStatus.mock.calls.map(([value]) => value)).toEqual([
      'Accepting',
      'Proposed',
      'Pending',
      'Completed',
      'Cancelled',
    ]);
  });
});
