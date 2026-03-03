// ActionMenuButton.tsx

import React from 'react';
import './ActionMenuButton.css';

type ActionMenuButtonProps = {
  onClick: () => void;
  style?: React.CSSProperties;
};

const ActionMenuButton: React.FC<ActionMenuButtonProps> = ({ onClick, style = {} }) => {
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

