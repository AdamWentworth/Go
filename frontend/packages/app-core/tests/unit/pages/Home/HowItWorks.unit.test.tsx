import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import HowItWorks from '@/pages/Home/HowItWorks';

describe('HowItWorks', () => {
  it('renders navigation, pokemon, and search guidance blocks', () => {
    const { container } = render(<MemoryRouter><HowItWorks /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Follow one Pokémon through the app' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add a Pokémon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Describe what you want' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prepare an offer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discover trainers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review the exchange' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share when useful' })).toBeInTheDocument();
    expect(screen.getByText('Server-authoritative trades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /illustrated guide/i })).toHaveAttribute('href', '/getting-started');
    expect(screen.getByText(/offering a Shiny Gigantamax Charizard/i)).toBeInTheDocument();
    expect(container.querySelectorAll('img[src="/images/shiny_gigantamax/shiny_gigantamax_6.png"]')).toHaveLength(6);
    expect(container.querySelectorAll('img[src="/images/costumes_shiny/pokemon_25_detective_shiny.png"]')).toHaveLength(5);
    expect(container.querySelector('img[src="/images/default/pokemon_1.png"]')).not.toBeInTheDocument();
  });
});
