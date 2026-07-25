import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
    expect(screen.getByText(/omits copies already above the selected league/))
      .toBeInTheDocument();
    expect(screen.getByText(/format simulation score at 70%/))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Pokémon keeps the build honest' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Separate formats, not client-side filters' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: 'Focused matchups and switch-aware 3v3 battles',
    }))
      .toBeInTheDocument();
    expect(screen.getByText(/Team Builder tests each assigned role/))
      .toBeInTheDocument();
    expect(screen.getByText(/deterministic matchup heuristic/))
      .toBeInTheDocument();
    expect(screen.getByText(/not claimed historical player teams/))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'June 2026 Trainer Battle update' }))
      .toHaveAttribute(
        'href',
        'https://pokemongo.com/news/pvp-updates2026?hl=en',
      );
    expect(screen.getByRole('link', { name: 'Competitors Cup transition' }))
      .toHaveAttribute(
        'href',
        'https://pokemongo.com/en/news/pvp-updates-competitors-cup-2026',
      );
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
