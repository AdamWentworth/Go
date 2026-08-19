import React from 'react';
import OverlayDismissButton from '@/components/OverlayDismissButton';
import OverlayPortal from '@/components/OverlayPortal';
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
  const handleYesClick = () => {
    onConfirm();
    onClose();
  };

  const handleNoClick = () => {
    onClose();
  };

  return (
    <OverlayPortal onClose={onClose}>
      <div className="confirmation-overlay" onClick={(event) => event.stopPropagation()}>
      <div className="confirmation-content">
        <p>
          Would you like to see {username}&apos;s {pokemonDisplayName} in their
          catalog?
        </p>
        <div className="confirmation-buttons">
          <OverlayDismissButton onDismiss={handleYesClick}>Yes</OverlayDismissButton>
          <OverlayDismissButton onDismiss={handleNoClick}>No</OverlayDismissButton>
        </div>
      </div>
      </div>
    </OverlayPortal>
  );
};

export default ConfirmationOverlay;
