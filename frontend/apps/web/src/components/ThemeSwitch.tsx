// ThemeSwitch.tsx

import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeSwitch.css';

const ThemeSwitch: React.FC = () => {
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    const lightModeStylesheet = document.getElementById('light-mode-stylesheet');
    if (isLightMode) {
      if (!lightModeStylesheet) {
        const link = document.createElement('link');
        link.id = 'light-mode-stylesheet';
        link.rel = 'stylesheet';
        link.href = '/Light-Mode.css';
        document.head.appendChild(link);
      }
    } else {
      lightModeStylesheet?.remove();
    }
  }, [isLightMode]);

  return (
    <label className="switch">
      <input 
        className="theme-input" 
        type="checkbox" 
        checked={!isLightMode} 
        onChange={toggleTheme} 
      />
      <div className="slider round">
        <div className="sun-moon">
          {[1, 2, 3].map((i) => (
            <svg key={`moon-dot-${i}`} className={`moon-dot moon-dot-${i}`} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="50" />
            </svg>
          ))}
          {[1, 2, 3].map((i) => (
            <svg key={`light-ray-${i}`} className={`light-ray light-ray-${i}`} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="50" />
            </svg>
          ))}
          {[1, 2, 3].map((i) => (
            <svg key={`cloud-dark-${i}`} className={`cloud-dark cloud-${i}`} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="50" />
            </svg>
          ))}
          {[4, 5, 6].map((i) => (
            <svg key={`cloud-light-${i}`} className={`cloud-light cloud-${i}`} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="50" />
            </svg>
          ))}
        </div>
        <div className="stars">
          {[1, 2, 3, 4].map((i) => (
            <svg key={`star-${i}`} className={`star star-${i}`} viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
          ))}
        </div>
      </div>
    </label>
  );
};

export default ThemeSwitch;