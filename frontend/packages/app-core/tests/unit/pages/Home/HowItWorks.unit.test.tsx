import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import HowItWorks from '@/pages/Home/HowItWorks';

describe('HowItWorks', () => {
  it('renders navigation, pokemon, and search guidance blocks', () => {
    render(<MemoryRouter><HowItWorks /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'From catalog to completed trade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Catalog and organize' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Find the right trainer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Propose with confidence' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share beyond the app' })).toBeInTheDocument();
    expect(screen.getByText('Server-authoritative trades')).toBeInTheDocument();
  });
});
