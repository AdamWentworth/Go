import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import GettingStarted from '@/pages/Home/GettingStarted';

describe('GettingStarted', () => {
  it('explains the complete workflow with working contextual links', async () => {
    const { container } = render(
      <MemoryRouter>
        <GettingStarted />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Your first useful trade, step by step.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Start your collection' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review and propose' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open trade preferences/i })).toHaveAttribute(
      'href',
      '/trades?section=preferences',
    );
    expect(screen.getByRole('link', { name: /create a trade board/i })).toHaveAttribute(
      'href',
      '/trade-board',
    );
    await expect(container).toHaveNoViolations();
  });
});
