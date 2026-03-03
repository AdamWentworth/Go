// useSwipeHandler.ts
import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD      = 100;
const MAX_PEEK_DISTANCE    = 0.3;
const DIRECTION_LOCK_ANGLE = 30;

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */
export interface UseSwipeHandlerProps {
  onSwipe?: (direction: 'left' | 'right' | null) => void;
  onDrag? : (dx: number) => void;
}

/** Keys match real React DOM-event names so callers can spread directly. */
export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove : (e: React.TouchEvent) => void;
  onTouchEnd  : (e: React.TouchEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?  : (e: React.MouseEvent) => void;
}

export default function useSwipeHandler(
  { onSwipe, onDrag }: UseSwipeHandlerProps,
): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX  = useRef(0);
  const isDragging   = useRef(false);
  const directionLock = useRef<'horizontal' | 'vertical' | null>(null);

  /* ----- helpers --------------------------------------------------- */
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    const tags = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'LABEL'];
    return !!(
      target instanceof Element &&
      (tags.includes(target.tagName) ||
        target.getAttribute('contentEditable') === 'true')
    );
  };

  /* ----- core ------------------------------------------------------ */
  const handleStart = useCallback((x: number, y: number) => {
    if (isInteractiveElement(document.elementFromPoint(x, y))) return;

    startX.current = x;
    startY.current = y;
    lastX.current  = x;
    isDragging.current = true;
    directionLock.current = null;
  }, []);

  const handleMove = useCallback((x: number, y: number) => {
    if (!isDragging.current) return;

    if (!directionLock.current) {
      const dx = x - startX.current;
      const dy = y - startY.current;
      const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
      directionLock.current =
        angle < DIRECTION_LOCK_ANGLE || angle > 180 - DIRECTION_LOCK_ANGLE
          ? 'horizontal'
          : 'vertical';
    }

    if (directionLock.current === 'horizontal') {
      const dx = x - startX.current;
      const limitedDx = Math.max(
        -window.innerWidth * MAX_PEEK_DISTANCE,
        Math.min(window.innerWidth * MAX_PEEK_DISTANCE, dx),
      );
      onDrag?.(limitedDx);
      lastX.current = x;
    }
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;

    const dx = lastX.current - startX.current;
    const absDx = Math.abs(dx);

    onSwipe?.(absDx > SWIPE_THRESHOLD ? (dx > 0 ? 'right' : 'left') : null);
    isDragging.current = false;
  }, [onSwipe]);

  /* ----- touch ----------------------------------------------------- */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    handleStart(t.clientX, t.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
    if (directionLock.current === 'horizontal') e.preventDefault();
  }, [handleMove]);

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  /* ----- mouse (dev) ---------------------------------------------- */
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    [handleStart],
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => e.buttons === 1 && handleMove(e.clientX, e.clientY),
    [handleMove],
  );
  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);

  /* ----- return ---------------------------------------------------- */
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...(import.meta.env.DEV && { onMouseDown, onMouseMove, onMouseUp }),
  };
}
