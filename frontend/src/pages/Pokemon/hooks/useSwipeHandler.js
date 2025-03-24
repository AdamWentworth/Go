// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 100; // Increased threshold for more deliberate swipes
const PEEK_THRESHOLD = 30; // Minimum pixels to show peeking

export default function useSwipeHandler({ onSwipe, onDrag }) {
  const startX = useRef(0);
  const lastX = useRef(0);
  const isDragging = useRef(false);

  const handleStart = useCallback((x) => {
    startX.current = x;
    lastX.current = x;
    isDragging.current = true;
  }, []);

  const handleMove = useCallback((x) => {
    if (!isDragging.current) return;
    lastX.current = x;
    const dx = x - startX.current;
    onDrag?.(dx);
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const dx = lastX.current - startX.current;
    const absDx = Math.abs(dx);
    const direction = dx > 0 ? 'right' : 'left';
    
    if (absDx > SWIPE_THRESHOLD) {
      onSwipe?.(direction);
    } else {
      onSwipe?.(null); // Cancel swipe
    }
  }, [onSwipe]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    handleStart(e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}