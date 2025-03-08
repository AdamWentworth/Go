// ThemeSwitch.jsx

import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext'; // adjust the path as needed
import './ThemeSwitch.css';

const ThemeSwitch = () => {
  const { isLightMode, toggleTheme } = useTheme();

  // Move light mode stylesheet injection logic here
  useEffect(() => {
    const lightModeStylesheet = document.getElementById('light-mode-stylesheet');
    if (isLightMode) {
      if (!lightModeStylesheet) {
        const link = document.createElement('link');
        link.id = 'light-mode-stylesheet';
        link.rel = 'stylesheet';
        link.href = `${process.env.PUBLIC_URL}/Light-Mode.css`;
        document.head.appendChild(link);
      }
    } else {
      if (lightModeStylesheet) {
        lightModeStylesheet.remove();
      }
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
          <svg className="moon-dot moon-dot-1" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="moon-dot moon-dot-2" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="moon-dot moon-dot-3" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="light-ray light-ray-1" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="light-ray light-ray-2" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="light-ray light-ray-3" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-dark cloud-1" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-dark cloud-2" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-dark cloud-3" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-light cloud-4" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-light cloud-5" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="cloud-light cloud-6" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>
        <div className="stars">
          <svg className="star star-1" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
          </svg>
          <svg className="star star-2" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
          </svg>
          <svg className="star star-3" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
          </svg>
          <svg className="star star-4" viewBox="0 0 20 20">
            <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
          </svg>
        </div>
      </div>
    </label>
  );
};

export default ThemeSwitch;
