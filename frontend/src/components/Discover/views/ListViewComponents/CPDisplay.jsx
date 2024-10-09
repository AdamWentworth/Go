// CPDisplay.jsx

import React from 'react';
import './CPDisplay.css'; // Optional, if you want to add specific styles

const CPDisplay = ({ cp }) => {
  return (
    <div className="cp-display-container">
      <span className="cp-label">CP</span><span className="cp-value">{cp}</span>
    </div>
  );
};

export default CPDisplay;
