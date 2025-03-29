// CustomScrollbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomScrollbar.css';

const CustomScrollbar = ({
  containerRef,
  scrollThumbImage = "/images/scroll.png",
  totalItems
}) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const rafRef = useRef(null);
  
  // Fixed thumb height matching the image size
  const THUMB_HEIGHT = 60;
  // The fraction of the container height used for the scroll track
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
        return;
      }
      
      const trackHeight = clientHeight * scrollHeightLimit;
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      const scrollPercentage = scrollTop / maxScrollTop;
      // Calculate position based on fixed thumb height
      const computedPosition = scrollPercentage * (trackHeight - THUMB_HEIGHT);
      
      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef, scrollHeightLimit, THUMB_HEIGHT]);

  useEffect(() => {
    updateScrollThumb();
  }, [totalItems, updateScrollThumb]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
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
    
    // Use the actual available movement space for the thumb
    const scrollbarTrackHeight = clientHeight * scrollHeightLimit;
    const availableTrackSpace = scrollbarTrackHeight - THUMB_HEIGHT;
    
    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY;
      // Calculate movement based on available track space
      const scrollbarDeltaPercentage = deltaY / availableTrackSpace;
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
          height: `${THUMB_HEIGHT}px`
        }}
        onPointerDown={handleThumbPointerDown}
      >
        <img src={scrollThumbImage} alt="scroll thumb" />
      </div>
    </div>
  );
};

export default React.memo(CustomScrollbar);