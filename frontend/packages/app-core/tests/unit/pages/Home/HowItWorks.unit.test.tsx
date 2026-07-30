import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HowItWorks from '@/pages/Home/HowItWorks';

vi.mock('react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('HowItWorks', () => {
  it('renders navigation, pokemon, and search guidance blocks', () => {
    render(<HowItWorks />);

    expect(screen.getByRole('heading', { name: /from collection to confident trade/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /build your catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /discover the community/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find reciprocal matches/i })).toBeInTheDocument();
  });
});
