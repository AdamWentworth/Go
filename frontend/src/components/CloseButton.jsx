import React from 'react';
import './CloseButton.css';

const CloseButton = ({ onClick, label = "Close", style = {} }) => {
  return (
    <button 
      className="close-button" 
      type="button" 
      onClick={onClick} 
      style={style}
    >
      {label}
    </button>
  );
};

export default CloseButton;
