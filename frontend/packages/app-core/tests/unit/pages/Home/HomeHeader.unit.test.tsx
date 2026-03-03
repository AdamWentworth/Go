import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HomeHeader from '@/pages/Home/HomeHeader';

vi.mock('@/components/AuthButtons', () => ({
  default: () => <div data-testid="auth-buttons">AuthButtons</div>,
}));

describe('HomeHeader', () => {
  it('renders branding content and auth buttons when logged out', () => {
    render(<HomeHeader logoUrl="/images/logo/logo.png" isLoggedIn={false} />);

    expect(screen.getByRole('heading', { name: /welcome to pok/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      '/images/logo/logo.png',
    );
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
  });

  it('hides auth buttons when logged in', () => {
    render(<HomeHeader logoUrl="/images/logo/logo.png" isLoggedIn />);

    expect(screen.queryByTestId('auth-buttons')).not.toBeInTheDocument();
  });
});
