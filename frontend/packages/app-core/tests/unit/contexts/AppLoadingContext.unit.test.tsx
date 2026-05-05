import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AppLoadingFallback,
  AppLoadingProvider,
} from '@/contexts/AppLoadingContext';

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

afterEach(() => {
  vi.useRealTimers();
});

const LoadingSource = ({ source }: { source: string }) => (
  <AppLoadingFallback source={source} />
);

describe('AppLoadingContext', () => {
  it('keeps one spinner mounted while loading sources hand off', () => {
    const { rerender } = render(
      <AppLoadingProvider>
        <LoadingSource source="route" />
      </AppLoadingProvider>,
    );
    const firstSpinner = screen.getByTestId('loading-spinner');

    rerender(
      <AppLoadingProvider>
        <LoadingSource source="pokemon-page" />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBe(firstSpinner);
  });

  it('delays hiding the spinner so brief loading gaps do not flicker', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <AppLoadingProvider>
        <LoadingSource source="route" />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    rerender(<AppLoadingProvider>{null}</AppLoadingProvider>);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('keeps the spinner visible until every active source finishes', () => {
    const { rerender } = render(
      <AppLoadingProvider>
        <LoadingSource source="route" />
        <LoadingSource source="pokemon-page" />
      </AppLoadingProvider>,
    );
    const firstSpinner = screen.getByTestId('loading-spinner');

    rerender(
      <AppLoadingProvider>
        <LoadingSource source="pokemon-page" />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBe(firstSpinner);

    rerender(<AppLoadingProvider>{null}</AppLoadingProvider>);

    expect(screen.getByTestId('loading-spinner')).toBe(firstSpinner);
  });
});
