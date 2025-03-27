// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const PEEK_THRESHOLD = 30;
const SWIPE_THRESHOLD = 100;
const MAX_PEEK_DISTANCE = 0.3;
const DIRECTION_LOCK_ANGLE = 30;

export default function useSwipeHandler({ onSwipe, onDrag }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const isDragging = useRef(false);
  const directionLock = useRef(null);

  const isInteractiveElement = (target) => {
    const interactiveTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'LABEL'];
    return interactiveTags.includes(target?.tagName) || 
           target?.contentEditable === 'true';
  };

  const handleStart = useCallback((x, y) => {
    if (isInteractiveElement(document.elementFromPoint(x, y))) return;
    
    startX.current = x;
    startY.current = y;
    lastX.current = x;
    isDragging.current = true;
    directionLock.current = null;
  }, []);

  const handleMove = useCallback((x, y) => {
    if (!isDragging.current) return;

    // Establish direction lock
    if (!directionLock.current) {
      const dx = x - startX.current;
      const dy = y - startY.current;
      const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
      
      if (angle < DIRECTION_LOCK_ANGLE || angle > 180 - DIRECTION_LOCK_ANGLE) {
        directionLock.current = 'horizontal';
      } else {
        directionLock.current = 'vertical';
      }
    }

    if (directionLock.current === 'horizontal') {
      const dx = x - startX.current;
      const limitedDx = Math.max(-window.innerWidth * MAX_PEEK_DISTANCE, 
        Math.min(window.innerWidth * MAX_PEEK_DISTANCE, dx));
      
      onDrag?.(limitedDx);
      lastX.current = x;
    }
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const dx = lastX.current - startX.current;
    const absDx = Math.abs(dx);
    
    if (absDx > SWIPE_THRESHOLD) {
      onSwipe?.(dx > 0 ? 'right' : 'left');
    } else {
      onSwipe?.(null);
    }
    
    isDragging.current = false;
  }, [onSwipe]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
    
    // Only prevent scroll when swiping horizontally
    if (directionLock.current === 'horizontal') {
      e.preventDefault();
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    if (e.buttons === 1) handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Only include mouse handlers in development
    ...(process.env.NODE_ENV === 'development' ? {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp
    } : {})
  };
}