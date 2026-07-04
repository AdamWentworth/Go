import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SortMenu from '@/pages/Pokemon/components/Menus/PokemonMenu/SortMenu';

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick }: { onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      Close
    </button>
  ),
}));

describe('SortMenu', () => {
  it('defaults favorite sorting to descending when selected from another sort type', () => {
    const setSortType = vi.fn();
    const setSortMode = vi.fn();

    render(
      <SortMenu
        sortType="number"
        setSortType={setSortType}
        sortMode="ascending"
        setSortMode={setSortMode}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /NUMBER Sort Direction/i }));
    fireEvent.click(screen.getByRole('button', { name: /FAVORITE/i }));

    expect(setSortType).toHaveBeenCalledWith('favorite');
    expect(setSortMode).toHaveBeenCalledWith('descending');
  });
});
