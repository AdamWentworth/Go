// CustomScrollbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomScrollbar.css';

const CustomScrollbar = ({
  containerRef,
  scrollThumbImage = "/images/scroll.png",
  totalItems,     // total number of items
  columns,        // number of columns in the grid
  cardHeight      // estimated card height in px
}) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(40); // default thumb height
  const rafRef = useRef(null);
  
  // Define the scrollable area height limit (85% of container)
  const scrollHeightLimit = 0.85;
  // Scale factor to increase the thumb size even more (triple the base size)
  const thumbScale = 3;

  const updateScrollThumb = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const clientHeight = container.clientHeight;
    const expectedRows = Math.ceil(totalItems / columns);
    const estimatedScrollHeight = expectedRows * cardHeight;
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;
      
      // If no scrolling is needed, hide the thumb.
      if (estimatedScrollHeight <= clientHeight) {
        setThumbHeight(0);
        return;
      }
      
      // Compute base thumb height proportional to the container's visible area.
      const baseHeight = Math.max((clientHeight / estimatedScrollHeight) * clientHeight, 20);
      // Scale the thumb height (tripling it)
      const newThumbHeight = baseHeight * thumbScale;
      setThumbHeight(newThumbHeight);
      
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
      const scrollPercentage = scrollTop / maxScrollTop;
      // Adjust thumb position using the scaled height
      const computedPosition = scrollPercentage * (limitedScrollbarHeight - newThumbHeight);
      
      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef, totalItems, columns, cardHeight, scrollHeightLimit, thumbScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTop = 0;
    updateScrollThumb();
    
    container.addEventListener('scroll', updateScrollThumb);
    window.addEventListener('resize', updateScrollThumb);
    
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollThumb);
      resizeObserver.observe(container);
    }
    
    return () => {
      container.removeEventListener('scroll', updateScrollThumb);
      window.removeEventListener('resize', updateScrollThumb);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, updateScrollThumb]);

  const handleThumbPointerDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const startY = e.clientY;
    const startScrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const expectedRows = Math.ceil(totalItems / columns);
    const estimatedScrollHeight = expectedRows * cardHeight;
    const maxScrollTop = estimatedScrollHeight - clientHeight;
    const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
    
    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY;
      // Convert the limited movement to the full scroll range.
      const scrollbarDeltaPercentage = deltaY / limitedScrollbarHeight;
      const newScrollTop = startScrollTop + (scrollbarDeltaPercentage * maxScrollTop);
      
      container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
    };
    
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div 
      className="custom-scrollbar"
      style={{
        bottom: `${(1 - scrollHeightLimit) * 100}%`
      }}
    >
      <div 
        className="scroll-thumb" 
        style={{ 
          transform: `translateY(${thumbPosition}px)`,
          height: `${thumbHeight}px`
        }}
        onPointerDown={handleThumbPointerDown}
      >
        <img src={scrollThumbImage} alt="scroll thumb" />
      </div>
    </div>
  );
};

export default React.memo(CustomScrollbar);