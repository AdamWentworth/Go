// ConfirmDialog.js

import React from 'react';
import './ModalStyles.css'; // Confirm dialog styling

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          {message}
        </div>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn btn-primary">
            OK
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
