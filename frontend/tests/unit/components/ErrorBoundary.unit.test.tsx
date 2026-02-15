import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ErrorBoundary from '@/components/ErrorBoundary';
import * as errorLogging from '@/utils/errorLogging';

const SafeChild = () => <div>Safe content</div>;

function AlwaysCrash(): never {
  throw new Error('boom-always');
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders fallback and logs when a child throws', () => {
    const logSpy = vi.spyOn(errorLogging, 'logAppError').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <AlwaysCrash />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('allows retry for transient render errors', () => {
    const logSpy = vi.spyOn(errorLogging, 'logAppError').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const TransientCrash = () => {
      if (shouldThrow) {
        throw new Error('boom-once');
      }
      return <div>Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <TransientCrash />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByText('Recovered content')).toBeInTheDocument();

    logSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
