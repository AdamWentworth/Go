// CPDisplay.jsx

import React from 'react';
import './CPDisplay.css'; // Optional, if you want to add specific styles

const CPDisplay = ({ cp }) => {
  return (
    <div className="cp-display-container">
      <span className="cp-label">CP</span><strong><span className="cp-value">{cp}</span></strong>
    </div>
  );
};

export default CPDisplay;
