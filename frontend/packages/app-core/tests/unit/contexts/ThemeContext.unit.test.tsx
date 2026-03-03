import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

const ThemeConsumer = () => {
  const { isLightMode, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="mode">{String(isLightMode)}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.getElementById('light-mode-stylesheet')?.remove();
  });

  it('reads stored light mode preference and mounts stylesheet', async () => {
    window.localStorage.setItem('isLightMode', 'true');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('true');

    await waitFor(() =>
      expect(document.getElementById('light-mode-stylesheet')).not.toBeNull(),
    );
    expect(
      document.getElementById('light-mode-stylesheet')?.getAttribute('href'),
    ).toBe('/Light-Mode.css');
  });

  it('toggles theme and keeps localStorage + stylesheet in sync', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('false');
    expect(window.localStorage.getItem('isLightMode')).toBeNull();

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode')).toHaveTextContent('true');
    expect(window.localStorage.getItem('isLightMode')).toBe('true');

    await waitFor(() =>
      expect(document.getElementById('light-mode-stylesheet')).not.toBeNull(),
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode')).toHaveTextContent('false');
    expect(window.localStorage.getItem('isLightMode')).toBe('false');

    await waitFor(() =>
      expect(document.getElementById('light-mode-stylesheet')).toBeNull(),
    );
  });

  it('throws a helpful error when useTheme is used outside provider', () => {
    const OutsideConsumer = () => {
      useTheme();
      return null;
    };

    expect(() => render(<OutsideConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    );
  });
});
