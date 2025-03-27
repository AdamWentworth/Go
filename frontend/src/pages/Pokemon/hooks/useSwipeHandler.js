// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const PEEK_THRESHOLD = 5; // Reduced from 10
const MAX_PEEK_DISTANCE = 0.25; // Reduced from 0.3 (25% of screen width)
const BASE_FRICTION = 0.7; // Reduced resistance
const VELOCITY_FACTOR = 0.15; // Increased velocity impact
const DIRECTION_LOCK_ANGLE = 25; // More forgiving angle
const MIN_SWIPE_VELOCITY = 0.3; // px/ms (new threshold)

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
    
    if (!directionLock.current) {
      const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
      directionLock.current = angle < DIRECTION_LOCK_ANGLE || angle > (180 - DIRECTION_LOCK_ANGLE) ? 'horizontal' : 'vertical';
    }

    if (directionLock.current === 'horizontal') {
      const now = Date.now();
      const deltaX = x - lastX.current;
      const deltaTime = Math.max(1, now - lastTime.current);
      
      // Increased sensitivity with velocity boost
      const velocity = deltaX / deltaTime;
      const dynamicFriction = BASE_FRICTION - (Math.abs(velocity) * VELOCITY_FACTOR);
      
      // Apply velocity boost to offset
      offsetRef.current += deltaX * Math.max(dynamicFriction, 0.3) * 1.2;
      onDrag?.(offsetRef.current);
      
      lastX.current = x;
      lastTime.current = now;
    }
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    if (directionLock.current === 'horizontal') {
      const containerWidth = window.innerWidth;
      const absOffset = Math.abs(offsetRef.current);
      const velocity = absOffset / (Date.now() - lastTime.current);
      
      // Combine distance and velocity thresholds
      const isDistanceSwipe = absOffset > (containerWidth * MAX_PEEK_DISTANCE);
      const isVelocitySwipe = velocity > MIN_SWIPE_VELOCITY;
      
      if (isDistanceSwipe || isVelocitySwipe) {
        const direction = offsetRef.current > 0 ? 'right' : 'left';
        onSwipe?.(direction);
      }
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
    // Only include mouse handlers in development
    ...(process.env.NODE_ENV === 'development' ? {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp
    } : {})
  };
}