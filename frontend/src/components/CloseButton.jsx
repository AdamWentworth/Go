// CloseButton.jsx

import React from 'react';
import './CloseButton.css';

const CloseButton = ({ onClick, style = {} }) => {
  return (
    <button 
      className="close-button" 
      type="button" 
      onClick={onClick} 
      style={style}
    >
      <img
        src="/images/close-button.png" // Path to the close button image in the public directory
        alt="Close"
        className="close-button-image"
      />
    </button>
  );
};

export default CloseButton;

