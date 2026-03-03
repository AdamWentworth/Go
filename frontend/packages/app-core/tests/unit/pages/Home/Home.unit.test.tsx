import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Home from '@/pages/Home/Home';

const mocks = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock('@/components/ActionMenu', () => ({
  default: () => <div data-testid="action-menu" />,
}));

vi.mock('@/components/AuthButtons', () => ({
  default: () => <div data-testid="auth-buttons">AuthButtons</div>,
}));

describe('Home page', () => {
  it('renders core sections and forwards auth state to HomeHeader', () => {
    mocks.useAuthMock.mockReturnValue({ isLoggedIn: false });

    render(<Home />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('action-menu')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
  });

  it('hides auth buttons when authenticated', () => {
    mocks.useAuthMock.mockReturnValue({ isLoggedIn: true });

    render(<Home />);

    expect(screen.queryByTestId('auth-buttons')).not.toBeInTheDocument();
  });
});
