import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import useErrorHandler from '@/pages/Search/hooks/useErrorHandler';

describe('useErrorHandler', () => {
  it('starts with null error', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.error).toBeNull();
  });

  it('sets and clears error values', () => {
    const { result } = renderHook(() => useErrorHandler<string>());

    act(() => {
      result.current.handleError('Invalid variant');
    });
    expect(result.current.error).toBe('Invalid variant');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it('supports non-string error payloads for legacy compatibility', () => {
    const { result } = renderHook(() =>
      useErrorHandler<{ message: string; code: number }>(),
    );

    act(() => {
      result.current.handleError({ message: 'boom', code: 500 });
    });

    expect(result.current.error).toEqual({ message: 'boom', code: 500 });
  });
});
