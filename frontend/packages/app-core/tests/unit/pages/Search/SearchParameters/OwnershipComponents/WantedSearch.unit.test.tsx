import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import WantedSearch from '@/pages/Search/SearchParameters/OwnershipComponents/WantedSearch';

vi.mock('@/pages/Search/SearchParameters/OwnershipComponents/FriendshipSearch', () => ({
  default: () => <div data-testid="friendship-search" />,
}));

describe('WantedSearch', () => {
  it('toggles registered and wanted-list filters', () => {
    const setAlreadyRegistered = vi.fn();
    const setTradeInWantedList = vi.fn();

    render(
      <WantedSearch
        prefLucky={false}
        setPrefLucky={vi.fn()}
        alreadyRegistered={false}
        setAlreadyRegistered={setAlreadyRegistered}
        tradeInWantedList={false}
        setTradeInWantedList={setTradeInWantedList}
        friendshipLevel={0}
        setFriendshipLevel={vi.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    expect(setAlreadyRegistered).toHaveBeenCalledWith(true);
    expect(setTradeInWantedList).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('friendship-search')).toBeInTheDocument();
  });

  it('supports legacy trade_in_wanted_list prop alias', () => {
    render(
      <WantedSearch
        prefLucky={false}
        setPrefLucky={vi.fn()}
        alreadyRegistered={false}
        setAlreadyRegistered={vi.fn()}
        trade_in_wanted_list={true}
        setTradeInWantedList={vi.fn()}
        friendshipLevel={0}
        setFriendshipLevel={vi.fn()}
      />,
    );

    const wantedCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(wantedCheckbox.checked).toBe(true);
  });
});
