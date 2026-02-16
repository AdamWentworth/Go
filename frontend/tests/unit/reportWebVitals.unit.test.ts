import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
}));

vi.mock('web-vitals', () => ({
  getCLS: mocks.getCLS,
  getFID: mocks.getFID,
  getFCP: mocks.getFCP,
  getLCP: mocks.getLCP,
  getTTFB: mocks.getTTFB,
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
      expect(mocks.getCLS).toHaveBeenCalledWith(callback);
      expect(mocks.getFID).toHaveBeenCalledWith(callback);
      expect(mocks.getFCP).toHaveBeenCalledWith(callback);
      expect(mocks.getLCP).toHaveBeenCalledWith(callback);
      expect(mocks.getTTFB).toHaveBeenCalledWith(callback);
    });
  });

  it('does not register handlers when callback is missing or not a function', async () => {
    reportWebVitals();
    reportWebVitals(null as unknown as (metric: unknown) => void);
    reportWebVitals('not-a-function' as unknown as (metric: unknown) => void);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocks.getCLS).not.toHaveBeenCalled();
    expect(mocks.getFID).not.toHaveBeenCalled();
    expect(mocks.getFCP).not.toHaveBeenCalled();
    expect(mocks.getLCP).not.toHaveBeenCalled();
    expect(mocks.getTTFB).not.toHaveBeenCalled();
  });
});
