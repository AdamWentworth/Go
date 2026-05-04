import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isViewportAtLeast,
  isViewportBelow,
  isViewportRange,
  useViewportBelow,
  useViewportRange,
  useViewportWidth,
} from '@/hooks/useViewport';

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

const resizeViewport = (width: number) => {
  act(() => {
    setViewportWidth(width);
    window.dispatchEvent(new Event('resize'));
  });
};

afterEach(() => {
  setViewportWidth(1024);
});

describe('viewport helpers', () => {
  it('evaluates breakpoint helpers with exclusive upper bounds', () => {
    expect(isViewportBelow(767, 768)).toBe(true);
    expect(isViewportBelow(768, 768)).toBe(false);
    expect(isViewportAtLeast(1024, 1024)).toBe(true);
    expect(isViewportRange(1024, 1024, 1440)).toBe(true);
    expect(isViewportRange(1440, 1024, 1440)).toBe(false);
  });

  it('tracks viewport width across resize events', () => {
    setViewportWidth(900);
    const { result } = renderHook(() => useViewportWidth());

    expect(result.current).toBe(900);

    resizeViewport(1200);

    expect(result.current).toBe(1200);
  });

  it('tracks max-width style viewport matches across resize events', () => {
    setViewportWidth(900);
    const { result } = renderHook(() => useViewportBelow(1024));

    expect(result.current).toBe(true);

    resizeViewport(1024);

    expect(result.current).toBe(false);
  });

  it('tracks viewport range matches across resize events', () => {
    setViewportWidth(1200);
    const { result } = renderHook(() => useViewportRange(1024, 1440));

    expect(result.current).toBe(true);

    resizeViewport(1440);

    expect(result.current).toBe(false);
  });
});
