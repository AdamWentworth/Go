import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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
  default: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
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
});
