// useSwipe.js
import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 50;

export default function useSwipe(onSwipe) {
  const touchStartX = useRef(0);
  const lastTouchX = useRef(0);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    lastTouchX.current = touch.clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    lastTouchX.current = touch.clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const dx = lastTouchX.current - touchStartX.current;
    if (dx > SWIPE_THRESHOLD) {
      onSwipe?.('right');
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipe?.('left');
    }
  }, [onSwipe]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}
