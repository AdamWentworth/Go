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
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('reads stored light mode preference and applies the document theme', async () => {
    window.localStorage.setItem('isLightMode', 'true');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('true');

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('light'),
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('toggles theme and keeps localStorage + document theme in sync', async () => {
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
      expect(document.documentElement.getAttribute('data-theme')).toBe('light'),
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode')).toHaveTextContent('false');
    expect(window.localStorage.getItem('isLightMode')).toBe('false');

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark'),
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
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
