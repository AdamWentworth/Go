// CustomScrollbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomScrollbar.css';

const CustomScrollbar = ({
  containerRef,
  scrollThumbImage = "/images/scroll.png",
  totalItems
}) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false); // New state for visibility
  const rafRef = useRef(null);
  const timeoutRef = useRef(null); // To handle fade-out delay

  const THUMB_HEIGHT = 60;
  const scrollHeightLimit = 0.85;

  const updateScrollThumb = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const clientHeight = container.clientHeight;
    const estimatedScrollHeight = container.scrollHeight;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;

      if (estimatedScrollHeight <= clientHeight) {
        setThumbPosition(0);
        setIsVisible(false); // Hide if no scrolling is needed
        return;
      }

      const trackHeight = clientHeight * scrollHeightLimit;
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      const scrollPercentage = scrollTop / maxScrollTop;
      const computedPosition = scrollPercentage * (trackHeight - THUMB_HEIGHT);

      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef, scrollHeightLimit, THUMB_HEIGHT]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Show scrollbar when scrolling starts
    setIsVisible(true);

    // Clear any existing timeout to prevent premature fade-out
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set a timeout to hide scrollbar after scrolling stops
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000); // Adjust delay as needed (1 second here)

    updateScrollThumb();
  }, [updateScrollThumb]);

  useEffect(() => {
    updateScrollThumb();
  }, [totalItems, updateScrollThumb]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollThumb();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollThumb);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollThumb);
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollThumb);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [containerRef, updateScrollThumb, handleScroll]);

  const handleThumbPointerDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    setIsVisible(true); // Show scrollbar when interacted with

    const startY = e.clientY;
    const startScrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const estimatedScrollHeight = container.scrollHeight;
    const maxScrollTop = estimatedScrollHeight - clientHeight;

    const scrollbarTrackHeight = clientHeight * scrollHeightLimit;
    const availableTrackSpace = scrollbarTrackHeight - THUMB_HEIGHT;

    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY;
      const scrollbarDeltaPercentage = deltaY / availableTrackSpace;
      const newScrollTop = startScrollTop + (scrollbarDeltaPercentage * maxScrollTop);

      container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
      setIsVisible(true); // Keep visible during drag
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      // Start fade-out timer after interaction ends
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className={`custom-scrollbar ${isVisible ? 'visible' : ''}`}
      style={{
        bottom: `${(1 - scrollHeightLimit) * 100}%`,
      }}
    >
      <div
        className="scroll-thumb"
        style={{
          transform: `translateY(${thumbPosition}px)`,
          height: `${THUMB_HEIGHT}px`,
        }}
        onPointerDown={handleThumbPointerDown}
      >
        <img src={scrollThumbImage} alt="scroll thumb" />
      </div>
    </div>
  );
};

export default React.memo(CustomScrollbar);