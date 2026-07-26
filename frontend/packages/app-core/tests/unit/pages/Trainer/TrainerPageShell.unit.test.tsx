import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import TrainerPageShell from '@/pages/Trainer/TrainerPageShell';

describe('TrainerPageShell', () => {
  it('returns to the screen that opened the trainer page', () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/pokemon',
          {
            pathname: '/profile',
            state: { contextBackTo: '/pokemon?view=caught' },
          },
        ]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/profile"
            element={
              <TrainerPageShell
                workspace="profile"
                eyebrow="Trainer"
                title="Profile"
              >
                Profile content
              </TrainerPageShell>
            }
          />
          <Route path="/pokemon" element={<div>Pokemon collection</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(screen.getByText('Pokemon collection')).toBeInTheDocument();
  });

  it('uses Home as a safe fallback when no opening context exists', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route
            path="/settings"
            element={
              <TrainerPageShell
                workspace="settings"
                eyebrow="App"
                title="Settings"
              >
                Settings content
              </TrainerPageShell>
            }
          />
          <Route path="/" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));

    expect(screen.getByText('Home screen')).toBeInTheDocument();
  });

  it('groups Friends under Profile without showing Settings as a peer', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <TrainerPageShell
          workspace="profile"
          eyebrow="Trainer"
          title="Profile"
        >
          Profile content
        </TrainerPageShell>
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', {
      name: /profile pages/i,
    });
    expect(navigation).toHaveTextContent('Profile');
    expect(navigation).toHaveTextContent('Friends');
    expect(navigation).not.toHaveTextContent('Settings');
    expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute(
      'href',
      '/profile/friends',
    );
  });

  it('groups Account under Settings with simple labels', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <TrainerPageShell workspace="settings" eyebrow="App" title="Settings">
          Settings content
        </TrainerPageShell>
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', {
      name: /settings pages/i,
    });
    expect(navigation).toHaveTextContent('Settings');
    expect(navigation).toHaveTextContent('Account');
    expect(navigation).not.toHaveTextContent('Friends');
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute(
      'href',
      '/settings/account',
    );
  });
});
