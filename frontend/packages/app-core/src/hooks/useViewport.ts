import { useCallback, useEffect, useState } from 'react';

export const VIEWPORT_BREAKPOINTS = {
  pokedexMenuSingleColumn: 650,
  overlayStacked: 768,
  desktop: 1024,
  wide: 1440,
} as const;

type ViewportMatcher = (width: number) => boolean;

const hasWindow = (): boolean => typeof window !== 'undefined';

export const isViewportBelow = (width: number, breakpoint: number): boolean =>
  width < breakpoint;

export const isViewportAtLeast = (width: number, breakpoint: number): boolean =>
  width >= breakpoint;

export const isViewportRange = (
  width: number,
  minInclusive: number,
  maxExclusive: number,
): boolean => width >= minInclusive && width < maxExclusive;

export const useViewportWidth = (fallbackWidth = 0): number => {
  const [width, setWidth] = useState<number>(() =>
    hasWindow() ? window.innerWidth : fallbackWidth,
  );

  useEffect(() => {
    if (!hasWindow()) return undefined;

    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

export const useViewportMatch = (
  matcher: ViewportMatcher,
  fallbackMatch = false,
): boolean => {
  const [matches, setMatches] = useState<boolean>(() =>
    hasWindow() ? matcher(window.innerWidth) : fallbackMatch,
  );

  useEffect(() => {
    if (!hasWindow()) return undefined;

    const handleResize = () => setMatches(matcher(window.innerWidth));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [matcher]);

  return matches;
};

export const useViewportBelow = (
  breakpoint: number,
  fallbackMatch = false,
): boolean => {
  const matcher = useCallback(
    (width: number) => isViewportBelow(width, breakpoint),
    [breakpoint],
  );
  return useViewportMatch(matcher, fallbackMatch);
};

export const useViewportRange = (
  minInclusive: number,
  maxExclusive: number,
  fallbackMatch = false,
): boolean => {
  const matcher = useCallback(
    (width: number) => isViewportRange(width, minInclusive, maxExclusive),
    [maxExclusive, minInclusive],
  );
  return useViewportMatch(matcher, fallbackMatch);
};
