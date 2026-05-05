import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

import { AppRouteFallback } from '@/App';
import { AppLoadingProvider } from '@/contexts/AppLoadingContext';

describe('App route fallback', () => {
  it('uses the shared loading spinner instead of text', () => {
    render(
      <AppLoadingProvider>
        <AppRouteFallback />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
