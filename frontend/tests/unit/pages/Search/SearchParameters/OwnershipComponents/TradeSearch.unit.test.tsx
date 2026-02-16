import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeSearch from '@/pages/Search/SearchParameters/OwnershipComponents/TradeSearch';

describe('TradeSearch', () => {
  it('toggles onlyMatchingTrades on checkbox change', () => {
    const setOnlyMatchingTrades = vi.fn();

    render(
      <TradeSearch
        onlyMatchingTrades={false}
        setOnlyMatchingTrades={setOnlyMatchingTrades}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(setOnlyMatchingTrades).toHaveBeenCalledWith(true);
  });
});
