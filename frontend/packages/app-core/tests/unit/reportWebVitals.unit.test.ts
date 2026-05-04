import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

vi.mock('web-vitals', () => ({
  onCLS: mocks.onCLS,
  onFCP: mocks.onFCP,
  onINP: mocks.onINP,
  onLCP: mocks.onLCP,
  onTTFB: mocks.onTTFB,
}));

import reportWebVitals from '@/reportWebVitals';

describe('reportWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers all web-vitals handlers when callback is provided', async () => {
    const callback = vi.fn();
    reportWebVitals(callback);

    await waitFor(() => {
      expect(mocks.onCLS).toHaveBeenCalledWith(callback);
      expect(mocks.onFCP).toHaveBeenCalledWith(callback);
      expect(mocks.onINP).toHaveBeenCalledWith(callback);
      expect(mocks.onLCP).toHaveBeenCalledWith(callback);
      expect(mocks.onTTFB).toHaveBeenCalledWith(callback);
    });
  });

  it('does not register handlers when callback is missing or not a function', async () => {
    reportWebVitals();
    reportWebVitals(null as unknown as (metric: unknown) => void);
    reportWebVitals('not-a-function' as unknown as (metric: unknown) => void);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocks.onCLS).not.toHaveBeenCalled();
    expect(mocks.onFCP).not.toHaveBeenCalled();
    expect(mocks.onINP).not.toHaveBeenCalled();
    expect(mocks.onLCP).not.toHaveBeenCalled();
    expect(mocks.onTTFB).not.toHaveBeenCalled();
  });
});
