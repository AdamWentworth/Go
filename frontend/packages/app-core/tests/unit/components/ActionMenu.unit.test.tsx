import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActionMenu from '@/components/ActionMenu';
import { requestActionMenuOpen } from '@/components/actionMenuEvents';

const mocks = vi.hoisted(() => ({
  auth: { isLoggedIn: false },
  fetchFriendsOverview: vi.fn(),
}));

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
  useAuth: () => mocks.auth,
}));

vi.mock('@/services/socialService', () => ({
  fetchFriendsOverview: mocks.fetchFriendsOverview,
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isLightMode: false }),
}));

vi.mock('@/contexts/ContextBackContext', () => ({
  isMobileContextBackEnvironment: () => false,
  useContextBackHandler: vi.fn(),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

describe('ActionMenu', () => {
  beforeEach(() => {
    mocks.auth.isLoggedIn = false;
    mocks.fetchFriendsOverview.mockReset();
  });

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

  it('can be opened by contextual guidance elsewhere in the app', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <ActionMenu />
      </MemoryRouter>,
    );

    act(() => requestActionMenuOpen());

    expect(container.querySelector('.action-menu-overlay')).toBeInTheDocument();
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

  it('navigates to community rankings instead of opening a placeholder', () => {
    render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rankings' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/rankings');
  });

  it('opens the signed-in Trade Board workspace without changing the nine primary destinations', () => {
    mocks.auth.isLoggedIn = true;
    mocks.fetchFriendsOverview.mockResolvedValue({ friends: [], incoming: [], outgoing: [], blocked: [] });

    const { container } = render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));
    expect(container.querySelectorAll('.action-menu-item')).toHaveLength(9);

    fireEvent.click(screen.getByRole('button', { name: 'Share Trade Board' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trade-board');
  });

  it('opens the real settings page instead of a placeholder modal', () => {
    render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/settings');
  });

  it('uses Profile as the single social destination and surfaces requests there', async () => {
    mocks.auth.isLoggedIn = true;
    mocks.fetchFriendsOverview.mockResolvedValue({
      friends: [],
      incoming: [{ friendship_id: 'friend-1' }],
      outgoing: [],
      blocked: [],
    });

    render(
      <MemoryRouter initialEntries={['/pokemon']}>
        <ActionMenu />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action Menu' }));

    await waitFor(() => expect(mocks.fetchFriendsOverview).toHaveBeenCalled());
    expect(
      screen.queryByRole('button', { name: /friends/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1')).toHaveClass('action-menu-notification');

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
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
