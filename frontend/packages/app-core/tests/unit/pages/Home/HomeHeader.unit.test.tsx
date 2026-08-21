import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import HomeHeader from '@/pages/Home/HomeHeader';

const renderHeader = (isLoggedIn: boolean) => render(
  <MemoryRouter>
    <HomeHeader logoUrl="/images/logo/logo.png" isLoggedIn={isLoggedIn} />
  </MemoryRouter>,
);

describe('HomeHeader', () => {
  it('renders honest product content and account actions when logged out', () => {
    renderHeader(false);

    expect(screen.getByRole('heading', { name: /start with your collection/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /show me how/i })).toHaveAttribute('href', '#start-here');
    expect(screen.getByRole('link', { name: /open the full guide/i })).toHaveAttribute('href', '/getting-started');
    expect(screen.getByText('Learn before signing up')).toBeInTheDocument();
  });

  it('hides guest calls to action when logged in', () => {
    renderHeader(true);

    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /show me how/i })).not.toBeInTheDocument();
  });
});
