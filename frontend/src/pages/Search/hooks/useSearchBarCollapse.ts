import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

type ScrollDecision = 'collapse' | 'expand' | 'consume_search_trigger' | 'none';

type EvaluateScrollDecisionArgs = {
  scrollY: number;
  searchBarOffsetTop: number;
  searchBarHeight: number;
  searchTriggered: boolean;
};

type UseSearchBarCollapseArgs = {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
};

export const getAdjustedCollapsePoint = (
  searchBarOffsetTop: number,
  searchBarHeight: number,
): number => {
  const searchBarBottom = searchBarOffsetTop + searchBarHeight;
  return searchBarBottom - searchBarHeight * 0.15;
};

export const evaluateScrollDecision = ({
  scrollY,
  searchBarOffsetTop,
  searchBarHeight,
  searchTriggered,
}: EvaluateScrollDecisionArgs): ScrollDecision => {
  const adjustedCollapsePoint = getAdjustedCollapsePoint(
    searchBarOffsetTop,
    searchBarHeight,
  );

  if (scrollY > adjustedCollapsePoint) {
    return 'collapse';
  }

  if (scrollY === 0) {
    return searchTriggered ? 'consume_search_trigger' : 'expand';
  }

  return 'none';
};

export const useSearchBarCollapse = ({
  isCollapsed,
  setIsCollapsed,
}: UseSearchBarCollapseArgs) => {
  const [isMidWidth, setIsMidWidth] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement | null>(null);
  const searchTriggeredRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMidWidth(window.innerWidth >= 1024 && window.innerWidth <= 1439);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!collapsibleRef.current || isCollapsed) return;

    const contentElement = collapsibleRef.current.querySelector('.content');
    if (!contentElement) return;

    const observer = new ResizeObserver(() => {
      if (!isCollapsed && collapsibleRef.current) {
        collapsibleRef.current.style.maxHeight = `${collapsibleRef.current.scrollHeight}px`;
      }
    });

    observer.observe(contentElement);
    return () => observer.disconnect();
  }, [isCollapsed]);

  useEffect(() => {
    if (!collapsibleRef.current) return;

    if (!isCollapsed) {
      collapsibleRef.current.style.maxHeight = `${collapsibleRef.current.scrollHeight}px`;
      const timer = setTimeout(() => {
        if (!isCollapsed && collapsibleRef.current) {
          collapsibleRef.current.style.overflow = 'visible';
        }
      }, 600);
      return () => clearTimeout(timer);
    }

    collapsibleRef.current.style.maxHeight = '0px';
    collapsibleRef.current.style.overflow = 'hidden';
    return undefined;
  }, [isCollapsed]);

  const handleScroll = useCallback(() => {
    const searchBar = collapsibleRef.current;
    const searchBarHeight = searchBar ? searchBar.offsetHeight : 0;
    const searchBarOffsetTop = searchBar ? searchBar.offsetTop : 0;

    const decision = evaluateScrollDecision({
      scrollY: window.scrollY,
      searchBarOffsetTop,
      searchBarHeight,
      searchTriggered: searchTriggeredRef.current,
    });

    if (decision === 'collapse') {
      setIsCollapsed(true);
      return;
    }

    if (decision === 'consume_search_trigger') {
      searchTriggeredRef.current = false;
      return;
    }

    if (decision === 'expand') {
      setIsCollapsed(false);
    }
  }, [setIsCollapsed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const markSearchTriggered = useCallback(() => {
    searchTriggeredRef.current = true;
  }, []);

  return {
    collapsibleRef,
    isMidWidth,
    toggleCollapse,
    markSearchTriggered,
  };
};
