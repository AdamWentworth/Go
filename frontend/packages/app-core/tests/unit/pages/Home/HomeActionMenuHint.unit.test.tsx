import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTION_MENU_OPEN_REQUEST } from '@/components/actionMenuEvents';
import HomeActionMenuHint from '@/pages/Home/HomeActionMenuHint';

describe('HomeActionMenuHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('explains the persistent Poké Ball navigation and opens the real action menu', () => {
    const openListener = vi.fn();
    window.addEventListener(ACTION_MENU_OPEN_REQUEST, openListener);

    render(<HomeActionMenuHint trainerKey="trainer-1" />);

    expect(screen.getByText(/Poké Ball/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open action menu' }));

    expect(openListener).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Action menu tip')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('pokegonexus-action-menu-hint:trainer-1')).toBe('seen');

    window.removeEventListener(ACTION_MENU_OPEN_REQUEST, openListener);
  });

  it('stays dismissed for the same trainer', () => {
    window.localStorage.setItem('pokegonexus-action-menu-hint:trainer-2', 'seen');

    render(<HomeActionMenuHint trainerKey="trainer-2" />);

    expect(screen.queryByLabelText('Action menu tip')).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<HomeActionMenuHint trainerKey="trainer-accessibility" />);

    await expect(container).toHaveNoViolations();
  });
});
