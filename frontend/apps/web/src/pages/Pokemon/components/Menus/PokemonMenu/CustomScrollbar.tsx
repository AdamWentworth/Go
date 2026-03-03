// CustomScrollbar.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomScrollbar.css';

export interface CustomScrollbarProps {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollThumbImage?: string;
  totalItems: number;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  containerRef,
  scrollThumbImage = '/images/scroll.png',
  totalItems,
}) => {
  const [thumbPosition, setThumbPosition] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const THUMB_HEIGHT = 60;
  const scrollHeightLimit = 0.85;

  const updateScrollThumb = useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;

    const clientHeight = container.clientHeight;
    const estimatedScrollHeight = container.scrollHeight;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;

      if (estimatedScrollHeight <= clientHeight) {
        setThumbPosition(0);
        setIsVisible(false);
        return;
      }

      const trackHeight = clientHeight * scrollHeightLimit;
      const maxScrollTop = estimatedScrollHeight - clientHeight;
      const scrollPercentage = scrollTop / maxScrollTop;
      const computedPosition = scrollPercentage * (trackHeight - THUMB_HEIGHT);

      setThumbPosition(scrollTop < 1 ? 0 : computedPosition);
    });
  }, [containerRef]);

  const handleScroll = useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;

    setIsVisible(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    updateScrollThumb();
  }, [containerRef, updateScrollThumb]);

  useEffect(() => {
    updateScrollThumb();
  }, [totalItems, updateScrollThumb]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollThumb();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollThumb);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollThumb);
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollThumb);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, handleScroll, updateScrollThumb]);

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    setIsVisible(true);

    const startY = e.clientY;
    const startScrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const estimatedScrollHeight = container.scrollHeight;
    const maxScrollTop = estimatedScrollHeight - clientHeight;

    const scrollbarTrackHeight = clientHeight * scrollHeightLimit;
    const availableTrackSpace = scrollbarTrackHeight - THUMB_HEIGHT;

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const deltaY = moveEvent.clientY - startY;
      const scrollbarDeltaPercentage = deltaY / availableTrackSpace;
      const newScrollTop = startScrollTop + scrollbarDeltaPercentage * maxScrollTop;

      container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
      setIsVisible(true);
    };

    const handlePointerUp = (): void => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className={`custom-scrollbar ${isVisible ? 'visible' : ''}`}
      style={{ bottom: `${(1 - scrollHeightLimit) * 100}%` }}
    >
      <div
        className="scroll-thumb"
        style={{ transform: `translateY(${thumbPosition}px)`, height: `${THUMB_HEIGHT}px` }}
        onPointerDown={handleThumbPointerDown}
      >
        <img src={scrollThumbImage} alt="scroll thumb" draggable={false} />
      </div>
    </div>
  );
};

export default React.memo(CustomScrollbar);
