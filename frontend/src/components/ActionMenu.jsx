// ActionMenu.jsx

import React, { useState } from 'react';
import ActionMenuButton from './ActionMenuButton';
import CloseButton from './CloseButton';
import './ActionMenu.css';

const ActionMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Overlay */}
      <div className={`action-menu-overlay ${isOpen ? 'active' : ''}`}>
        {isOpen && (
          <>
            {/* Close button in the overlay */}
            <CloseButton onClick={toggleMenu} />
            <div className="action-menu-content">
              {children ? children : <p>This is the action menu content.</p>}
            </div>
          </>
        )}
      </div>

      {/* When closed, show the action menu button */}
      {!isOpen && <ActionMenuButton onClick={toggleMenu} />}
    </>
  );
};

export default ActionMenu;
