import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import HowItWorks from '@/pages/Home/HowItWorks';

describe('HowItWorks', () => {
  it('renders navigation, pokemon, and search guidance blocks', () => {
    render(<HowItWorks />);

    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Action Menu Button' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Search Button' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /explore the pok/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /manage your collection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find trades/i })).toBeInTheDocument();
  });
});
