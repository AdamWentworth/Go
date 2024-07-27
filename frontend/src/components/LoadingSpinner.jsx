import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';  // Assuming the styles are defined here

function LoadingSpinner() {
    const [dotState, setDotState] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotState(prev => (prev + 1) % 3); // Cycles through 0, 1, 2
        }, 500); // Changes state every 500ms

        return () => clearInterval(interval); // Clean up the interval on component unmount
    }, []);

    const dotText = ".".repeat(dotState + 1); // Creates the text "Loading.", "Loading..", or "Loading..."

    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">Loading{dotText}</div>
        </div>
    );
}

export default LoadingSpinner;
