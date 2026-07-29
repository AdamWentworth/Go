import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VerifyEmailChange from '@/pages/Authentication/VerifyEmailChange';

const mocks = vi.hoisted(() => ({ confirmEmailChange: vi.fn() }));

vi.mock('@/services/authService', () => ({
  confirmEmailChange: mocks.confirmEmailChange,
}));

describe('VerifyEmailChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmEmailChange.mockResolvedValue(undefined);
  });

  it('confirms the token and requires a fresh login', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email-change?token=secure-token']}>
        <Routes>
          <Route path="/verify-email-change" element={<VerifyEmailChange />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(mocks.confirmEmailChange).toHaveBeenCalledWith('secure-token'),
    );
    expect(screen.getByRole('heading', { name: /email updated/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue to login/i }))
      .toHaveAttribute('href', '/login');
  });
});
