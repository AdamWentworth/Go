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

vi.mock('@/components/AuthButtons', () => ({
  default: () => <div data-testid="auth-buttons">AuthButtons</div>,
}));
vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (selector: (state: { instances: Record<string, unknown> }) => unknown) =>
    selector({ instances: {} }),
}));
vi.mock('@/features/trades/store/useTradeStore', () => ({
  useTradeStore: (selector: (state: { trades: Record<string, unknown> }) => unknown) =>
    selector({ trades: {} }),
}));
vi.mock('react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('Home page', () => {
  it('renders core sections and forwards auth state to HomeHeader', () => {
    mocks.useAuthMock.mockReturnValue({ isLoggedIn: false });

    render(<Home />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /from collection to confident trade/i })).toBeInTheDocument();
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
  });

  it('hides auth buttons when authenticated', () => {
    mocks.useAuthMock.mockReturnValue({ isLoggedIn: true });

    render(<Home />);

    expect(screen.queryByTestId('auth-buttons')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});
