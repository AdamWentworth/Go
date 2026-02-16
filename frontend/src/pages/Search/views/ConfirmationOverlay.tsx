import React from 'react';
import './ConfirmationOverlay.css';

type ConfirmationOverlayProps = {
  username: string;
  pokemonDisplayName: string;
  instanceId?: string;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({
  username,
  pokemonDisplayName,
  onConfirm,
  onClose,
}) => {
  const handleYesClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onConfirm();
    onClose();
  };

  const handleNoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <div
      className="confirmation-overlay"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="confirmation-content">
        <p>
          Would you like to see {username}&apos;s {pokemonDisplayName} in their
          catalog?
        </p>
        <div className="confirmation-buttons">
          <button onClick={handleYesClick}>Yes</button>
          <button onClick={handleNoClick}>No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationOverlay;
