import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import HowItWorks from '@/pages/Home/HowItWorks';

describe('HowItWorks', () => {
  it('renders navigation, pokemon, and search guidance blocks', () => {
    render(<MemoryRouter><HowItWorks /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Follow one Pokémon through the app' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add a Pokémon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Describe what you want' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prepare an offer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discover trainers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review the exchange' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share when useful' })).toBeInTheDocument();
    expect(screen.getByText('Server-authoritative trades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /illustrated guide/i })).toHaveAttribute('href', '/getting-started');
  });
});
