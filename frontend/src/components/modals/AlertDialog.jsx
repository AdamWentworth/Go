// AlertDialog.js

import React, { useState } from 'react';
import './AlertDialog.css'; // Unique styling for alert modal

const AlertDialog = ({ message, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClick = () => {
    // Begin fade out
    setClosing(true);
    // After the transition ends, call onClose to remove the modal
    setTimeout(() => {
      onClose();
    }, 300); // Make sure this matches the CSS transition duration
  };

  return (
    <div 
      className={`modal-overlay ${closing ? 'fade-out' : ''}`}
      onClick={handleClick}
    >
      <div className="alert-modal">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default AlertDialog;
