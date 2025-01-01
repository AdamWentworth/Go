// AlertDialog.js

import React from 'react';
import './ModalStyles.css'; // Ensure consistent styling

const AlertDialog = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
