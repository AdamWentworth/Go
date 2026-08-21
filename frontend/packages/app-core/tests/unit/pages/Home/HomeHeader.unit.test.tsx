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

    expect(screen.getByRole('heading', { name: /your collection/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Build your collection' })).toHaveAttribute('href', '/register');
    expect(screen.getByText('Your listings, your privacy')).toBeInTheDocument();
  });

  it('hides guest calls to action when logged in', () => {
    renderHeader(true);

    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Build your collection' })).not.toBeInTheDocument();
  });
});
