import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordOverlay from '@/pages/Authentication/ResetPasswordOverlay';

const mocks = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  resetPassword: mocks.resetPassword,
}));

describe('ResetPasswordOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetPassword.mockResolvedValue({});
  });

  it('submits the identifier and closes after the privacy-safe response', async () => {
    const onClose = vi.fn();
    render(<ResetPasswordOverlay onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'adam@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /email reset link/i }));

    await waitFor(() =>
      expect(mocks.resetPassword).toHaveBeenCalledWith({
        identifier: 'adam@example.com',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('is an accessible modal and closes from its close control', () => {
    const onClose = vi.fn();
    render(<ResetPasswordOverlay onClose={onClose} />);

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: /close password reset/i }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
