// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const PEEK_THRESHOLD = 10; // Minimum pixels to start peeking
const MAX_PEEK_DISTANCE = 0.3; // 30% of container width
const FRICTION = 0.6; // Dampening factor for smoother drag

export default function useSwipeHandler({ onSwipe, onDrag }) {
  const startX = useRef(0);
  const startTime = useRef(0);
  const lastX = useRef(0);
  const isDragging = useRef(false);
  const isPeeking = useRef(false);

  const handleStart = useCallback((x) => {
    startX.current = x;
    lastX.current = x;
    startTime.current = Date.now();
    isDragging.current = true;
    isPeeking.current = false;
  }, []);

  const handleMove = useCallback((x) => {
    if (!isDragging.current) return;
    
    const dx = x - startX.current;
    const absDx = Math.abs(dx);
    
    // Start peeking only after a small threshold
    if (!isPeeking.current && absDx > PEEK_THRESHOLD) {
      isPeeking.current = true;
    }
    
    if (isPeeking.current) {
      // Apply non-linear friction for smoother drag
      const sign = Math.sign(dx);
      const dampedDx = sign * Math.pow(Math.abs(dx), FRICTION);
      
      onDrag?.(dampedDx);
    }
    
    lastX.current = x;
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const dx = lastX.current - startX.current;
    const absDx = Math.abs(dx);
    const direction = dx > 0 ? 'right' : 'left';
    
    // Reset dragging states
    isDragging.current = false;
    isPeeking.current = false;
    
    // Determine if it was a significant swipe
    const isSwipe = absDx > (window.innerWidth * MAX_PEEK_DISTANCE);
    
    onSwipe?.(isSwipe ? direction : null);
  }, [onSwipe]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX);
    // Prevent default to reduce browser interference
    e.preventDefault();
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX);
    // Prevent scrolling during drag
    e.preventDefault();
  }, [handleMove]);

  const handleTouchEnd = useCallback((e) => {
    handleEnd();
    // Prevent any lingering default behaviors
    e.preventDefault();
  }, [handleEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    // Only trigger on left mouse button
    if (e.button === 0) {
      handleStart(e.clientX);
      // Prevent text selection during drag
      e.preventDefault();
    }
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    // Only move if left mouse button is pressed
    if (e.buttons === 1) {
      handleMove(e.clientX);
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