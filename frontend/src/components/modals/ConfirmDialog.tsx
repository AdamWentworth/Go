// ConfirmDialog.txs

import React from 'react';
import './ModalStyles.css';

type ConfirmDialogProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
  const lines = message.split('\n');

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          {lines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
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
