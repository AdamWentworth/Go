import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import FriendshipSearch from '@/pages/Search/SearchParameters/OwnershipComponents/FriendshipSearch';

describe('FriendshipSearch', () => {
  it('disables preferred lucky when friendship slider drops below max', () => {
    const setFriendshipLevel = vi.fn();
    const setPrefLucky = vi.fn();

    render(
      <FriendshipSearch
        friendshipLevel={4}
        setFriendshipLevel={setFriendshipLevel}
        prefLucky={true}
        setPrefLucky={setPrefLucky}
      />,
    );

    fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });

    expect(setFriendshipLevel).toHaveBeenCalledWith(3);
    expect(setPrefLucky).toHaveBeenCalledWith(false);
  });

  it('promotes friendship to max and toggles lucky when lucky icon is clicked', () => {
    const setFriendshipLevel = vi.fn();
    const setPrefLucky = vi.fn();

    render(
      <FriendshipSearch
        friendshipLevel={2}
        setFriendshipLevel={setFriendshipLevel}
        prefLucky={false}
        setPrefLucky={setPrefLucky}
      />,
    );

    fireEvent.click(screen.getByAltText('Lucky Friend'));

    expect(setFriendshipLevel).toHaveBeenCalledWith(4);
    const toggleArg = setPrefLucky.mock.calls[0]?.[0] as (prev: boolean) => boolean;
    expect(typeof toggleArg).toBe('function');
    expect(toggleArg(false)).toBe(true);
  });
});
