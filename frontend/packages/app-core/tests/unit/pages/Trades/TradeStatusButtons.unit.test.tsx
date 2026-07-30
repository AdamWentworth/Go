import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeStatusButtons from '@/pages/Trades/TradeStatusButtons';

describe('TradeStatusButtons', () => {
  it('renders the three hub sections and marks the selected one active', () => {
    const setSelectedSection = vi.fn();

    render(
      <TradeStatusButtons
        selectedSection="active"
        setSelectedSection={setSelectedSection}
        activeCount={3}
      />,
    );

    expect(screen.getByRole('button', { name: /Matches/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Active/ })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /History/ })).toBeInTheDocument();
    expect(screen.getByLabelText('3 active trades')).toBeInTheDocument();
  });

  it('emits canonical hub section values when buttons are clicked', () => {
    const setSelectedSection = vi.fn();

    render(
      <TradeStatusButtons
        selectedSection="matches"
        setSelectedSection={setSelectedSection}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Active/ }));
    fireEvent.click(screen.getByRole('button', { name: /History/ }));

    expect(setSelectedSection.mock.calls.map(([value]) => value)).toEqual([
      'active',
      'history',
    ]);
  });
});
