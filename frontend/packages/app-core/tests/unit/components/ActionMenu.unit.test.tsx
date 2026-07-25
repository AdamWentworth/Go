import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import ActionMenu from '@/components/ActionMenu';

vi.mock('@/components/ActionMenuButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Action Menu
    </button>
  ),
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      Close
    </button>
  ),
}));

vi.mock('@/components/ThemeSwitch', () => ({
  default: () => <div>Theme</div>,
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ alert: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isLoggedIn: false }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isLightMode: false }),
}));

vi.mock('@/contexts/ContextBackContext', () => ({
  useContextBackHandler: vi.fn(),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

describe('ActionMenu', () => {
  it('keeps Home centered among nine destinations and navigates to Max Battles', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));

    expect(container.querySelectorAll('.action-menu-item')).toHaveLength(9);
    expect(container.querySelector('.button-home')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Max Battles' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/max');
  });

  it('navigates to the PvP rankings page', () => {
    render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'PvP' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/pvp');
  });

  it('keeps the close control disabled until the opening gesture has settled', () => {
    vi.useFakeTimers();

    try {
      const { container } = render(
        <MemoryRouter initialEntries={['/pokemon']}>
          <ActionMenu />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));

      const closeButton = screen.getByRole('button', { name: 'Close' });
      expect(closeButton).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(75);
      });
      expect(closeButton).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(closeButton).toBeEnabled();
      fireEvent.click(closeButton);
      expect(container.querySelector('.action-menu-overlay')).toHaveAttribute(
        'data-menu-state',
        'closed',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
