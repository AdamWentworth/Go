import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';

import useSwipeHandler from '@/pages/Pokemon/hooks/useSwipeHandler';

const originalElementFromPoint = document.elementFromPoint;
const originalInnerWidth = window.innerWidth;

const touchEvent = (
  x: number,
  y: number,
  preventDefault = vi.fn(),
) =>
  ({
    touches: [{ clientX: x, clientY: y }],
    preventDefault,
  }) as unknown as React.TouchEvent;

describe('useSwipeHandler', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => document.body),
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1000,
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: originalElementFromPoint,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('drags and swipes horizontally without calling preventDefault from passive touch events', () => {
    const onDrag = vi.fn();
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeHandler({ onDrag, onSwipe }));
    const preventDefault = vi.fn();

    act(() => {
      result.current.onTouchStart(touchEvent(500, 100));
      result.current.onTouchMove(touchEvent(360, 104, preventDefault));
      result.current.onTouchEnd(touchEvent(360, 104));
    });

    expect(onDrag).toHaveBeenLastCalledWith(-140);
    expect(onSwipe).toHaveBeenCalledWith('left');
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('leaves vertical gestures alone', () => {
    const onDrag = vi.fn();
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipeHandler({ onDrag, onSwipe }));

    act(() => {
      result.current.onTouchStart(touchEvent(500, 100));
      result.current.onTouchMove(touchEvent(504, 260));
      result.current.onTouchEnd(touchEvent(504, 260));
    });

    expect(onDrag).not.toHaveBeenCalled();
    expect(onSwipe).toHaveBeenCalledWith(null);
  });

  it('resets internal gesture state without emitting drag callbacks when disabled', () => {
    const onDrag = vi.fn();
    const onSwipe = vi.fn();
    const { result, rerender } = renderHook(
      ({ disabled }) => useSwipeHandler({ disabled, onDrag, onSwipe }),
      { initialProps: { disabled: false } },
    );

    act(() => {
      result.current.onTouchStart(touchEvent(500, 100));
      result.current.onTouchMove(touchEvent(360, 104));
    });

    expect(onDrag).toHaveBeenCalledWith(-140);
    onDrag.mockClear();

    act(() => {
      rerender({ disabled: true });
    });

    expect(onDrag).not.toHaveBeenCalled();

    act(() => {
      result.current.onTouchEnd(touchEvent(360, 104));
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });
});
