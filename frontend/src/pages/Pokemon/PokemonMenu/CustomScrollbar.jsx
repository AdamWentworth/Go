// CustomScrollbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomScrollbar.css';

const CustomScrollbar = ({
  containerRef,
  scrollThumbImage = "/images/scroll.png",
  totalItems
}) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(40);
  const rafRef = useRef(null);
  
  // The fraction of the container height used to compute the scrollbar area.
  const scrollHeightLimit = 0.85;
  const thumbScale = 4;

  const updateScrollThumb = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const clientHeight = container.clientHeight;
    // Use the actual scrollHeight from the container (which now reflects the full virtual grid).
    const estimatedScrollHeight = container.scrollHeight;
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;
      
      if (estimatedScrollHeight <= clientHeight) {
        setThumbHeight(0);
        return;
      }
      
      const baseHeight = Math.max((clientHeight / estimatedScrollHeight) * clientHeight, 20);
      const newThumbHeight = baseHeight * thumbScale;
      setThumbHeight(newThumbHeight);
      
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
      const scrollPercentage = scrollTop / maxScrollTop;
      const computedPosition = scrollPercentage * (limitedScrollbarHeight - newThumbHeight);
      
      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef, scrollHeightLimit, thumbScale]);

  useEffect(() => {
    updateScrollThumb();
  }, [totalItems, updateScrollThumb]);

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
    const estimatedScrollHeight = container.scrollHeight;
    const maxScrollTop = estimatedScrollHeight - clientHeight;
    const limitedScrollbarHeight = clientHeight * scrollHeightLimit;
    
    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY;
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
