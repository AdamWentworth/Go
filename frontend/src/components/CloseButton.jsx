// CloseButton.jsx
import React from 'react';
import './CloseButton.css';
import { useTheme } from '../contexts/ThemeContext'; // Import ThemeContext

const CloseButton = ({ onClick, style = {} }) => {
  const { isLightMode } = useTheme(); // Consume theme context
  const imageSrc = isLightMode 
    ? '/images/close-button-light.png' 
    : '/images/close-button.png'; // Select image based on theme

  return (
    <button 
      className="close-button" 
      type="button" 
      onClick={onClick} 
      style={style}
    >
      <img
        src={imageSrc}
        alt="Close"
        className="close-button-image"
      />
    </button>
  );
};

export default CloseButton;
