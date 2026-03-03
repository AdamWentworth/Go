// LoadingSpinner.tsx
import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  const spinnerVideoSrc = "/assets/loading_spinner.webm";
  const [loadingText, setLoadingText] = useState('Loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prev) => (prev === 'Loading...' ? 'Loading' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <video className="spinner-video" autoPlay loop muted playsInline>
        <source src={spinnerVideoSrc} type="video/webm" />
      </video>
      <div className="loading-text">{loadingText}</div>
    </div>
  );
};

export default LoadingSpinner;
