// LoadingSpinner.jsx
import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  const spinnerVideoSrc = `${process.env.PUBLIC_URL}/assets/loading_spinner.webm`;

  // State to cycle through "Loading", "Loading.", "Loading..", "Loading..."
  const [loadingText, setLoadingText] = useState("Loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === "Loading...") return "Loading";
        return prev + ".";
      });
    }, 500); // Change every 500ms

    return () => clearInterval(interval); // Cleanup interval
  }, []);

  return (
    <div className="loading-container">
      <video className="spinner-video" autoPlay loop muted playsInline>
        <source src={spinnerVideoSrc} type="video/webm" />
      </video>
      <div className="loading-text">{loadingText}</div>
    </div>
  );
}

export default LoadingSpinner;