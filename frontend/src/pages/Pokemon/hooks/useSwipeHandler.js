// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const PEEK_THRESHOLD = 10;
const MAX_PEEK_DISTANCE = 0.3;
const BASE_FRICTION = 0.78;
const VELOCITY_FACTOR = 0.12;
const DIRECTION_LOCK_ANGLE = 30; // Degrees from vertical to consider as horizontal swipe

export default function useSwipeHandler({ onSwipe, onDrag }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const isDragging = useRef(false);
  const offsetRef = useRef(0);
  const directionLock = useRef(null);

  const handleStart = useCallback((x, y) => {
    startX.current = x;
    startY.current = y;
    lastX.current = x;
    lastTime.current = Date.now();
    isDragging.current = true;
    offsetRef.current = 0;
    directionLock.current = null;
  }, []);

  const handleMove = useCallback((x, y) => {
    if (!isDragging.current) return;

    const dx = x - startX.current;
    const dy = y - startY.current;
    
    // Determine swipe direction lock
    if (!directionLock.current) {
      const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
      directionLock.current = angle < DIRECTION_LOCK_ANGLE || angle > (180 - DIRECTION_LOCK_ANGLE) ? 'horizontal' : 'vertical';
    }

    // Only process horizontal movement if direction is locked to horizontal
    if (directionLock.current === 'horizontal') {
      const now = Date.now();
      const deltaX = x - lastX.current;
      const deltaTime = Math.max(1, now - lastTime.current);
      
      const velocity = deltaX / deltaTime;
      const dynamicFriction = BASE_FRICTION - (Math.abs(velocity) * VELOCITY_FACTOR);
      
      offsetRef.current += deltaX * Math.max(dynamicFriction, 0.4);
      onDrag?.(offsetRef.current);
      
      lastX.current = x;
      lastTime.current = now;
    }
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    // Only trigger swipe if direction was horizontal
    if (directionLock.current === 'horizontal') {
      const containerWidth = window.innerWidth;
      const isSwipe = Math.abs(offsetRef.current) > (containerWidth * MAX_PEEK_DISTANCE);
      const direction = offsetRef.current > 0 ? 'right' : 'left';
      onSwipe?.(isSwipe ? direction : null);
    }
    
    isDragging.current = false;
    offsetRef.current = 0;
  }, [onSwipe]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
    e.preventDefault();
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
    if (directionLock.current === 'horizontal') e.preventDefault();
  }, [handleMove]);

  const handleTouchEnd = useCallback((e) => {
    handleEnd();
    // Prevent any lingering default behaviors
    e.preventDefault();
  }, [handleEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      handleStart(e.clientX, e.clientY);
      e.preventDefault();
    }
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    if (e.buttons === 1) {
      handleMove(e.clientX, e.clientY);
    }
  }, [handleMove]);

  const handleMouseUp = useCallback((e) => {
    // Only end on left mouse button
    if (e.button === 0) {
      handleEnd();
    }
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