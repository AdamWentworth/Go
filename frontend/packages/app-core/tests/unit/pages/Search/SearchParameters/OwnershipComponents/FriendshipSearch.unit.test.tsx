import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import FriendshipSearch from '@/pages/Search/SearchParameters/OwnershipComponents/FriendshipSearch';

describe('FriendshipSearch', () => {
  it('disables preferred lucky only below Best Friends', () => {
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

  it('promotes friendship to Best Friends and toggles lucky when clicked', () => {
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

  it('renders five non-wrapping hearts and keeps lucky independent at Forever Friends', () => {
    const setFriendshipLevel = vi.fn();
    const setPrefLucky = vi.fn();

    const { container } = render(
      <FriendshipSearch
        friendshipLevel={5}
        setFriendshipLevel={setFriendshipLevel}
        prefLucky={true}
        setPrefLucky={setPrefLucky}
      />,
    );

    expect(container.querySelectorAll('.heart')).toHaveLength(5);
    expect(
      screen.getByLabelText(
        '5 of 5 friendship hearts, Forever Friends remote trade eligible',
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
    expect(setPrefLucky).not.toHaveBeenCalledWith(false);
  });
});
