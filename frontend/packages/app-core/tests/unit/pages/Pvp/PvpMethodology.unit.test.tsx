import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import PvpMethodology from '@/pages/Pvp/PvpMethodology';

describe('PvP methodology page', () => {
  it('documents rankings, IV Rank, caught builds, cups, Team Builder, and Battle Lab', () => {
    render(
      <MemoryRouter>
        <PvpMethodology />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'How PvP rankings work' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A pinned simulation snapshot' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: 'Every IV spread at its legal ceiling',
    })).toBeInTheDocument();
    expect(screen.getByText(/compares all 4,096 possible/))
      .toBeInTheDocument();
    expect(screen.getByText(/groups caught copies of the selected species/))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Pokémon keeps the build honest' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Separate formats, not client-side filters' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exact builds in a controlled 1v1' }))
      .toBeInTheDocument();
    expect(screen.getByText(/Team Builder analyzes published matchup evidence/))
      .toBeInTheDocument();
    expect(screen.getByText(/does not yet model team swaps/))
      .toBeInTheDocument();
  });

  it('returns to the PvP workspace without exposing internal version hashes', () => {
    render(
      <MemoryRouter>
        <PvpMethodology />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /PvP/ })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /PvP/ })[0])
      .toHaveAttribute('href', '/pvp');
    expect(screen.queryByText(/catalog [a-f0-9]{12}/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/moves [a-f0-9]{12}/i)).not.toBeInTheDocument();
  });
});
