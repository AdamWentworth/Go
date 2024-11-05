// useResponsiveUI.js

import { useState, useEffect } from 'react';

function useResponsiveUI(setShowFilterUI, setShowCollectUI) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isWide = windowWidth >= 1024;
    setShowFilterUI(isWide);
    setShowCollectUI(isWide);
  }, [windowWidth, setShowFilterUI, setShowCollectUI]);
}

export default useResponsiveUI;
