// useSwipeHandler.js
import { useRef, useCallback } from 'react';

const PEEK_THRESHOLD = 10;
const MAX_PEEK_DISTANCE = 0.3;
const BASE_FRICTION = 0.75;
const VELOCITY_FACTOR = 0.15;

export default function useSwipeHandler({ onSwipe, onDrag }) {
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const isDragging = useRef(false);
  const offsetRef = useRef(0);

  const handleStart = useCallback((x) => {
    startX.current = x;
    lastX.current = x;
    lastTime.current = Date.now();
    isDragging.current = true;
    offsetRef.current = 0;
  }, []);

  const handleMove = useCallback((x) => {
    if (!isDragging.current) return;
    
    const now = Date.now();
    const deltaX = x - lastX.current;
    const deltaTime = Math.max(1, now - lastTime.current);
    
    // Calculate velocity-adjusted friction
    const velocity = deltaX / deltaTime;
    const dynamicFriction = BASE_FRICTION - (Math.abs(velocity) * VELOCITY_FACTOR);
    
    offsetRef.current += deltaX * Math.max(dynamicFriction, 0.4);
    onDrag?.(offsetRef.current);
    
    lastX.current = x;
    lastTime.current = now;
  }, [onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const containerWidth = window.innerWidth;
    const isSwipe = Math.abs(offsetRef.current) > (containerWidth * MAX_PEEK_DISTANCE);
    const direction = offsetRef.current > 0 ? 'right' : 'left';
    
    onSwipe?.(isSwipe ? direction : null);
    isDragging.current = false;
    offsetRef.current = 0;
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