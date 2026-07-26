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
              <TrainerPageShell eyebrow="Trainer" title="Profile">
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
              <TrainerPageShell eyebrow="Preferences" title="Settings">
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
});
