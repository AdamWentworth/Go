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
  const [thumbHeight, setThumbHeight] = useState(20);
  const rafRef = useRef(null);
  
  // Define the scrollable area height limit (85% of container)
  const scrollHeightLimit = 0.85; // 85% of the container height

  const updateScrollThumb = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const clientHeight = container.clientHeight;
    const expectedRows = Math.ceil(totalItems / columns);
    const estimatedScrollHeight = expectedRows * cardHeight;
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;
      
      if (estimatedScrollHeight <= clientHeight) {
        setThumbHeight(0);
        return;
      }
      
      const newThumbHeight = Math.max((clientHeight / estimatedScrollHeight) * clientHeight, 20);
      setThumbHeight(newThumbHeight);
      
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      
      // Calculate the limited scroll area height
      const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
      
      // Map the full scroll range to the limited scrollbar range
      const scrollPercentage = scrollTop / maxScrollTop;
      const computedPosition = scrollPercentage * (limitedScrollbarHeight - newThumbHeight);
      
      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef, totalItems, columns, cardHeight, scrollHeightLimit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTop = 0;
    updateScrollThumb();
    
    container.addEventListener('scroll', updateScrollThumb);
    window.addEventListener('resize', updateScrollThumb);
    
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollThumb();
      });
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
    
    // The limited height for scrollbar movement
    const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
    
    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY;
      
      // Convert the limited movement to the full scroll range
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
        bottom: `${(1 - scrollHeightLimit) * 100}%` // Set bottom position to 20% from bottom
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