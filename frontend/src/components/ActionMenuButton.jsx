// ActionMenuButton.jsx

import React from 'react';
import './ActionMenuButton.css'; // Create similar CSS as CloseButton.css if needed

const ActionMenuButton = ({ onClick, style = {} }) => {
  return (
    <button 
      className="action-menu-button" 
      type="button" 
      onClick={onClick} 
      style={style}
    >
      <img
        src="/images/btn_action_menu.png"
        alt="Action Menu"
        className="action-menu-button-image"
      />
    </button>
  );
};

export default ActionMenuButton;
