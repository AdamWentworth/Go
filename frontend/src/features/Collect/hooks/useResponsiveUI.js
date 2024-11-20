// useResponsiveUI.js

import { useState, useEffect } from 'react';

function useResponsiveUI(setShowFilterUI, setShowCollectUI) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isWide, setIsWide] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsWide(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isWideScreen = windowWidth >= 1024;
    setShowFilterUI(isWideScreen);
    setShowCollectUI(isWideScreen);
  }, [windowWidth, setShowFilterUI, setShowCollectUI]);

  return isWide;
}

export default useResponsiveUI;
