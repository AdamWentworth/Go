import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type ArcHeightInput = {
  panelTopPx: number;
  baselineLift: number;
  topGap: number;
  headerBottomY: number;
};

export const calculateArcHeight = ({
  panelTopPx,
  baselineLift,
  topGap,
  headerBottomY,
}: ArcHeightInput): number => {
  const baselineY = panelTopPx - baselineLift;
  return Math.max(0, Math.round(baselineY - headerBottomY - topGap));
};

export const useArcHeight = () => {
  const arcLayerRef = useRef<HTMLDivElement | null>(null);

  const recalcArcHeight = useCallback(() => {
    if (typeof window === 'undefined') return;

    const layer = arcLayerRef.current;
    if (!layer) return;

    const column = layer.closest('.caught-column') as HTMLElement | null;
    if (!column) return;

    const columnRect = column.getBoundingClientRect();
    const before = window.getComputedStyle(column, '::before');
    const panelTopPx = parseFloat(before.top) || 0;

    const css = window.getComputedStyle(layer);
    const baselineLift = parseFloat(css.getPropertyValue('--arc-baseline-offset')) || 6;
    const topGap = parseFloat(css.getPropertyValue('--arc-top-gap')) || 0;

    const tops: number[] = [];
    const topRow = column.querySelector('.top-row') as HTMLElement | null;
    if (topRow) tops.push(topRow.getBoundingClientRect().bottom - columnRect.top);
    const bgRow = column.querySelector('.background-select-row') as HTMLElement | null;
    if (bgRow && bgRow.offsetParent !== null) {
      tops.push(bgRow.getBoundingClientRect().bottom - columnRect.top);
    }
    const headerBottomY = tops.length ? Math.max(...tops) : 0;

    const desired = calculateArcHeight({
      panelTopPx,
      baselineLift,
      topGap,
      headerBottomY,
    });
    layer.style.setProperty('--arc-height', `${desired}px`);
  }, []);

  useLayoutEffect(() => {
    recalcArcHeight();
  }, [recalcArcHeight]);

  useEffect(() => {
    const onResize = () => recalcArcHeight();
    window.addEventListener('resize', onResize);

    const layer = arcLayerRef.current;
    const column = layer?.closest('.caught-column') as HTMLElement | null;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(recalcArcHeight) : null;

    if (ro && column) {
      ro.observe(column);
      const topRow = column.querySelector('.top-row') as HTMLElement | null;
      const bgRow = column.querySelector('.background-select-row') as HTMLElement | null;
      if (topRow) ro.observe(topRow);
      if (bgRow) ro.observe(bgRow);
    }

    const timer = setTimeout(recalcArcHeight, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [recalcArcHeight]);

  return { arcLayerRef, recalcArcHeight };
};

