import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('smoothly scrolls to the guide instead of using the browser hash jump', () => {
    const guide = document.createElement('section');
    guide.id = 'start-here';
    const scrollIntoView = vi.fn();
    guide.scrollIntoView = scrollIntoView;
    document.body.appendChild(guide);

    renderHeader(false);
    fireEvent.click(screen.getByRole('link', { name: /show me how/i }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('#start-here');
    guide.remove();
    window.history.replaceState(null, '', '/');
  });
});
