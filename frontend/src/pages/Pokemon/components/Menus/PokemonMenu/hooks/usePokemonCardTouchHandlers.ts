// usePokemonCardTouchHandlers.ts

import { useRef } from 'react';

interface UseTouchHandlersProps {
  onSelect: () => void;
  onSwipe?: (dir: 'left' | 'right') => void;
  toggleCardHighlight: (key: string) => void; // kept for API compatibility, not used here
  setIsFastSelectEnabled: (enabled: boolean) => void;
  isEditable: boolean;
  isFastSelectEnabled: boolean;
  isDisabled: boolean;

  /**
   * Preferred identifier for this card (usually instance_id, falling back to variant key).
   * Optional because the hook does not currently use it directly; parent owns selection logic.
   */
  selectKey?: string;
}

const LONG_PRESS_MS = 300;
const SWIPE_THRESHOLD = 50;
const MOVE_CANCEL_THRESHOLD = 10;

export function usePokemonCardTouchHandlers({
  onSelect,
  onSwipe,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isEditable,
  isFastSelectEnabled,
  isDisabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectKey,
}: UseTouchHandlersProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTouchX = useRef(0);
  const isSwiping = useRef(false);
  const isScrolling = useRef(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const touchHandled = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    touchHandled.current = false;
    isSwiping.current = false;
    isScrolling.current = false;
    longPressTriggered.current = false;

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    lastTouchX.current = touch.clientX;

    // Long-press to enter fast-select mode and select this card via parent logic.
    if (isEditable) {
      longPressTimeout.current = setTimeout(() => {
        if (!isSwiping.current && !isScrolling.current && !isFastSelectEnabled) {
          setIsFastSelectEnabled(true);
          // Defer so the state flip is visible to parent before it runs handleSelect
          setTimeout(() => onSelect(), 0);
        }
        longPressTriggered.current = true;
      }, LONG_PRESS_MS);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    lastTouchX.current = touch.clientX;
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy)) isSwiping.current = true;

    if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    const dx = lastTouchX.current - touchStartX.current;
    if (isSwiping.current && Math.abs(dx) > SWIPE_THRESHOLD) {
      const direction = dx < 0 ? 'left' : 'right';
      onSwipe?.(direction);
      touchHandled.current = true;
      return;
    }

    // If we already did a long-press action, do nothing more on touch end.
    if (isScrolling.current || longPressTriggered.current) return;

    // Always route selection/highlight through parent so it picks the correct key (instance_id vs variant).
    onSelect();
    touchHandled.current = true;
  };

  const handleClick = () => {
    // Suppress click that immediately follows a handled touch
    if (touchHandled.current) {
      touchHandled.current = false;
      return;
    }
    if (isDisabled) return;

    // Always defer to parent; it knows whether to open overlay or toggle highlight.
    onSelect();
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
  };
}
