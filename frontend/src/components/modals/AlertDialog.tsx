// AlertDialog.tsx

import React, { useState } from 'react';
import './AlertDialog.css';

type AlertDialogProps = {
  message: string;
  onClose: () => void;
};

const AlertDialog: React.FC<AlertDialogProps> = ({ message, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClick = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
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
