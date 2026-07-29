import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPassword from '@/pages/Authentication/ResetPassword';

const mocks = vi.hoisted(() => ({
  confirmPasswordReset: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  confirmPasswordReset: mocks.confirmPasswordReset,
}));

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmPasswordReset.mockResolvedValue({ message: 'updated' });
  });

  const renderPage = (entry = '/reset-password?token=secure-token') =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>,
    );

  it('confirms a valid matching password and shows completion', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'Different_valid_42!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'Different_valid_42!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({
        token: 'secure-token',
        password: 'Different_valid_42!',
      }),
    );
    expect(screen.getByRole('heading', { name: /password updated/i }))
      .toBeInTheDocument();
  });

  it('disables submission when the reset token is missing', () => {
    renderPage('/reset-password');
    expect(screen.getByRole('button', { name: /update password/i }))
      .toBeDisabled();
    expect(screen.getByText(/reset link is incomplete/i)).toBeInTheDocument();
  });
});
