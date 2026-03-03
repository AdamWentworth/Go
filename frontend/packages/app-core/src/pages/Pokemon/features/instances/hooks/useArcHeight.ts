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
    // CP is absolutely positioned in the header, so it can extend outside .top-row.
    // Include its rendered bottom to keep the arc apex below CP reliably.
    const cpRow = column.querySelector('.cp-component-container') as HTMLElement | null;
    if (cpRow) tops.push(cpRow.getBoundingClientRect().bottom - columnRect.top);
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

    // Preserve a circular dot with a stable pixel size even when the SVG stretches.
    const overlay = layer.querySelector('.level-arc-overlay') as HTMLElement | null;
    if (overlay) {
      const rect = overlay.getBoundingClientRect();
      const xScale = rect.width > 0 ? rect.width / 1000 : 1;
      const yScale = rect.height > 0 ? rect.height / 500 : 1;
      // Dot radius in LevelArc defaults to 12 viewBox units.
      const targetDotPx = 10;
      const targetScale = targetDotPx / (2 * 12);

      const dotScaleX = xScale > 0 ? targetScale / xScale : 1;
      const dotScaleY = yScale > 0 ? targetScale / yScale : 1;
      layer.style.setProperty('--arc-dot-scale-x', String(dotScaleX));
      layer.style.setProperty('--arc-dot-scale-y', String(dotScaleY));
    }
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
      const cpRow = column.querySelector('.cp-component-container') as HTMLElement | null;
      const bgRow = column.querySelector('.background-select-row') as HTMLElement | null;
      if (topRow) ro.observe(topRow);
      if (cpRow) ro.observe(cpRow);
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
