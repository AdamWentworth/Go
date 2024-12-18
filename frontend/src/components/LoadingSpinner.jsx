// LoadingSpinner.jsx
import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
    const [dotState, setDotState] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotState(prev => (prev + 1) % 3);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const dotText = ".".repeat(dotState + 1);

    return (
        <div className="loading-container" role="status" aria-label="Loading">
            <div className="spinner"></div>
            <div className="loading-text">Loading{dotText}</div>
        </div>
    );
}

export default LoadingSpinner;
