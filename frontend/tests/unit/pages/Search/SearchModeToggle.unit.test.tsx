import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchModeToggle, { type SearchMode } from '@/pages/Search/SearchModeToggle';

describe('SearchModeToggle', () => {
  it('renders welcome style modifiers when isWelcome is true', () => {
    const setSearchMode = vi.fn();
    const { container } = render(
      <SearchModeToggle
        searchMode={null}
        setSearchMode={
          setSearchMode as React.Dispatch<React.SetStateAction<SearchMode>>
        }
        isWelcome
      />,
    );

    expect(container.querySelector('.search-toggle-container.welcome')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trainer' })).toHaveClass('large');
    expect(screen.getByRole('button', { name: 'Pokemon' })).toHaveClass('large');
  });

  it('marks only the active mode button', () => {
    const setSearchMode = vi.fn();
    const { rerender } = render(
      <SearchModeToggle
        searchMode="trainer"
        setSearchMode={
          setSearchMode as React.Dispatch<React.SetStateAction<SearchMode>>
        }
      />,
    );

    expect(screen.getByRole('button', { name: 'Trainer' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Pokemon' })).not.toHaveClass(
      'active',
    );

    rerender(
      <SearchModeToggle
        searchMode="pokemon"
        setSearchMode={
          setSearchMode as React.Dispatch<React.SetStateAction<SearchMode>>
        }
      />,
    );

    expect(screen.getByRole('button', { name: 'Pokemon' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Trainer' })).not.toHaveClass(
      'active',
    );
  });

  it('calls setSearchMode with the selected mode', () => {
    const setSearchMode = vi.fn();

    render(
      <SearchModeToggle
        searchMode={null}
        setSearchMode={
          setSearchMode as React.Dispatch<React.SetStateAction<SearchMode>>
        }
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trainer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pokemon' }));

    expect(setSearchMode).toHaveBeenNthCalledWith(1, 'trainer');
    expect(setSearchMode).toHaveBeenNthCalledWith(2, 'pokemon');
  });
});
